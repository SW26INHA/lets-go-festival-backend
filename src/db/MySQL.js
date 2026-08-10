import mysql2 from 'mysql2/promise'

import { config } from '../config'
import { logger } from '../utils'

const DB = config.db.mysql

const pool = mysql2.createPool(DB)

/**
 * MySQL Pool 종료.
 * 서버 종료나 일회성 스크립트 종료 시 사용한다.
 *
 * @returns {Promise<void>}
 */
const close = async () => {
  await pool.end()
}

/**
 * MySQL 커넥션 획득.
 * 트랜잭션처럼 하나의 커넥션을 유지해야 할 때만 사용하고, 반드시 release()해야 한다.
 *
 * @returns {Promise<Object>} 커넥션 객체.
 */
const connect = async () => {
  try {
    return await pool.getConnection()
  } catch (error) {
    logger.error(`MySQL 연결오류: ${error.message}`)
    throw error
  }
}

/**
 * 쿼리 실행.
 *
 * 풀에서 커넥션을 빌려 실행하고 자동으로 반납하므로 동시 실행해도 안전하다.
 * 값은 모두 "?" 플레이스홀더로 바인딩되어 이스케이프된다.
 *
 * @param {String} query 실행할 쿼리문
 * @param {Array} params 바인딩 파라미터
 * @returns {Promise<any>} SELECT는 행 배열을, 그 외에는 실행 결과(affectedRows 등)를 반환.
 */
const executeQuery = async (query, params = []) => {
  logger.debug(`MySQL query: ${query}`)
  logger.debug(`MySQL params: %o`, params)

  const [result] = await pool.query(query, params)

  return result
}

/**
 * 데이터 INSERT 실행.
 * 전달된 인자들을 이용하여 데이터 추가를 위한 쿼리문 실행 후 결과 반환.
 *
 * @param {String} table 데이터를 추가할 테이블명.
 * @param {Array} fields 데이터 추가를 위한 필드 목록.
 * @param {Array} values 추가할 데이터 값 목록.
 * @returns {Promise<any>} 데이터 추가를 위한 쿼리문 실행 후 결과 반환. 오류가 발생할 경우 오류 반환.
 */
const insert = async (table, fields, values) => {
  fields = parseFields(fields)

  // SQL 인젝션 방지를 위해 VALUES를 직접 문자열로 만들지 않고 "?" 플레이스홀더 사용
  const placeholders = values.map(() => '?').join(', ')
  const query = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`

  return await insertQuery(query, values)
}

/**
 * INSERT 쿼리 실행.
 *
 * @param {String} query 실행할 쿼리문
 * @param {Array} values 바인딩 파라미터(값)
 * @returns {Promise<any>}
 */
const insertQuery = async (query, values) => {
  try {
    return await executeQuery(query, values)
  } catch (error) {
    logger.error(`MySQL INSERT 오류 : ${error.message}`)
    throw error
  }
}

/**
 * Object 형태의 값을 INSERT.
 * 테이블에 데이터를 추가한 후 결과 반환.
 *
 * @param {String} table 데이터를 추가할 테이블명.
 * @param {Object} objectValues 추가할 데이터를 위한 필드명과 값을 포함하는 객체.
 * @returns {Promise} 데이터 추가를 위한 쿼리문 실행 후 결과 반환. 오류가 발생할 경우 오류 반환.
 */
const insertValues = async (table, objectValues) => {
  const fields = Object.keys(objectValues)
  const values = Object.values(objectValues)

  return await insert(table, fields, values)
}

/**
 * 필드 목록을 문자열로 변환.
 * 데이터 추가를 위한 값 목록을 쿼리문에서 사용할 문자열로 변경하여 반환.
 *
 * @param {Array|String} fields 필드 목록.
 * @returns {String} 삽일할 데이터의 필드 값.
 */
const parseFields = (fields) => {
  if (Array.isArray(fields) && fields.length > 0) {
    return fields.join(', ')
  }

  return fields
}

/**
 * WHERE 조건 파싱.
 * - 모든 값은 "?" 플레이스홀더로 바인딩된다.
 * - 최상위 key는 반드시 "컬럼명"이어야 한다.
 * - 연산자는 객체 구조로 명시한다.
 * - 문자열 WHERE는 내부 상수 용도로만 사용해야 한다.
 *
 * @param {String} query 실행할 쿼리문.
 * @param {Object|String} where 시행할 쿼리문에 사용할 조건.
 * @param {Array} params 파라미터 누적 배열
 * @returns {{ query: String, params: Array }}
 *
 * @example
 * parseWhere(
 *   'SELECT * FROM table',
 *   { columnName: { between: [value1, value2] } },
 *   []
 * )
 *
 * @example
 * parseWhere(
 *   'SELECT * FROM table',
 *   { columnName: { like: '%value%' } },
 *   []
 * )
 *
 * @example
 * parseWhere(
 *   'SELECT * FROM table',
 *   {
 *     columnName: { in: [value1, value2] },
 *     columnName: { notIn: [value1, value2] },
 *   },
 *   []
 * )
 *
 * @example
 * parseWhere(
 *   'SELECT * FROM table',
 *   {
 *     columnName: { match: searchKeyword }
 *   },
 *   []
 * )
 *
 * @example
 * parseWhere(
 *   'SELECT * FROM table',
 *   {
 *     columnName: { operator: '>=', value: compareValue }
 *   },
 *   []
 * )
 */
const parseWhere = (query, where, params = []) => {
  if (!where) return { query, params }

  // 문자열 WHERE는 외부 입력이 없다는 전제 하에만 허용
  if (typeof where === 'string') {
    query += ` WHERE ${where}`
    return { query, params }
  }

  if (typeof where === 'object' && where !== null) {
    const conditions = []

    Object.entries(where).forEach(([key, value]) => {
      // BETWEEN
      if (value?.between && Array.isArray(value.between)) {
        conditions.push(`${key} BETWEEN ? AND ?`)
        params.push(value.between[0], value.between[1])
        return
      }

      // NOT BETWEEN
      if (value?.notBetween && Array.isArray(value.notBetween)) {
        conditions.push(`${key} NOT BETWEEN ? AND ?`)
        params.push(value.notBetween[0], value.notBetween[1])
        return
      }

      // LIKE
      if (value?.like !== undefined) {
        conditions.push(`${key} LIKE ?`)
        params.push(value.like)
        return
      }

      // IN
      if (value?.in && Array.isArray(value.in)) {
        const placeholders = value.in.map(() => '?').join(', ')
        conditions.push(`${key} IN (${placeholders})`)
        params.push(...value.in)
        return
      }

      // NOT IN
      if (value?.notIn && Array.isArray(value.notIn)) {
        const placeholders = value.notIn.map(() => '?').join(', ')
        conditions.push(`${key} NOT IN (${placeholders})`)
        params.push(...value.notIn)
        return
      }

      // MATCH ... AGAINST (FULLTEXT)
      if (value?.match !== undefined) {
        conditions.push(`MATCH(${key}) AGAINST (? IN BOOLEAN MODE)`)
        params.push(value.match)
        return
      }

      // 비교 연산자 (>, <, >=, <=, !=)
      if (value?.operator && value?.value !== undefined) {
        conditions.push(`${key} ${value.operator} ?`)
        params.push(value.value)
        return
      }

      // 기본 =
      conditions.push(`${key} = ?`)
      params.push(value)
    })

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
  }

  return { query, params }
}

/**
 * GROUP BY 절 추가.
 * 조회 쿼리문에 그룹 조회문을 추가하여 반환.
 *
 * @param {String} query 조회 쿼리문.
 * @param {String} group 그룹 조회를 위한 필드명.
 * @returns {String} 그룹 조회문이 추가된 조회 쿼리문.
 */
const parseGroup = (query, group) => {
  if (group) {
    return `${query} GROUP BY ${group}`
  }

  return query
}

/**
 * ORDER BY 절 추가.
 * 조회 쿼리문의 정렬 방법을 추가한 후 실행할 쿼리문 반환.
 *
 * @param {String} query 실행할 조회 쿼리문.
 * @param {String} order 조회 정렬 방법.
 * @returns {String} 정렬 방법이 추가되 조회 쿼리문 반환.
 */
const parseOrder = (query, order) => {
  if (order) {
    return `${query} ORDER BY ${order}`
  }

  return query
}

/**
 * LIMIT 추가
 * @param {string} query
 * @param {string|number} limit
 * @returns
 */
const parseLimit = (query, limit) => {
  if (limit === undefined || limit === null) return query

  const safeLimit = Number(limit)
  if (!Number.isInteger(safeLimit) || safeLimit < 0) {
    throw new Error('Invalid LIMIT value')
  }

  return `${query} LIMIT ${safeLimit}`
}

/**
 * SELECT 실행.
 *
 * @param {String} table
 * @param {Array|String} fields
 * @param {Object|String|null} where
 * @param {String|null} group
 * @param {String|null} order
 * @param {String|number|null} limit
 * @returns {Promise<any>}
 */
const select = async (
  table,
  fields,
  where = null,
  order = null,
  group = null,
  limit = null
) => {
  fields = parseFields(fields)

  let query = `SELECT ${fields} FROM ${table}`
  let params = []

  const whereResult = parseWhere(query, where, params)
  query = whereResult.query
  params = whereResult.params

  query = parseGroup(query, group)
  query = parseOrder(query, order)
  query = parseLimit(query, limit)

  return await selectQuery(query, params)
}

/**
 * SELECT 쿼리 실행.
 *
 * @param {String} query
 * @param {Array} params
 * @returns {Promise<any>}
 */
const selectQuery = async (query, params) => {
  try {
    return await executeQuery(query, params)
  } catch (error) {
    logger.error(`MySQL SELECT 오류 : ${error.message}`)
    throw error
  }
}

/**
 * UPDATE 실행.
 *
 * @param {String} table 업데이트를 진행할 테이블명.
 * @param {Object} values 업데이트할 필드명과 값을 포함하는 객체.
 * @param {Object|String} where 업데이트 쿼리문에 사용할 조건절.
 * @returns {Promise<any>} 업데이트에 성공하였을 경우 업데이트 결과 데이터를 반환하고 오류가 발생할 경우 오류 반환.
 */
const update = async (table, values, where) => {
  let query = `UPDATE ${table}`
  let params = []

  const updateResult = parseUpdateValues(query, values, params)
  query = updateResult.query
  params = updateResult.params

  const whereResult = parseWhere(query, where, params)
  query = whereResult.query
  params = whereResult.params

  return await updateQuery(query, params)
}

/**
 * UPDATE SET 절 파싱.
 *
 * @param {String} query 업데이트 쿼리문.
 * @param {Object} values 업데이트할 데이터에 대한 필드명과 값을 포함하는 객체.
 * @param {Array} params 업데이트할 필드명과 값이 포함된 쿼리문.
 * @returns {{ query: String, params: Array }}
 */
const parseUpdateValues = (query, values, params) => {
  if (typeof values === 'object' && values !== null) {
    const keys = Object.keys(values)
    if (keys.length > 0) {
      const sets = keys.map((key) => {
        params.push(values[key])
        return `${key} = ?`
      })
      query += ` SET ${sets.join(', ')}`
    }
  }
  return { query, params }
}

/**
 * UPDATE 쿼리 실행.
 *
 * @param {String} query 실행할 업데이트 쿼리문.
 * @param {Array} params 업데이트할 필드명과 값이 포함된 쿼리문.
 * @returns {Promise<any>} 업데이트 쿼리문 실행에 성공하였을 경우 업데이트 결과 반환, 오류가 발생할 경우 오류 반환.
 */
const updateQuery = async (query, params) => {
  try {
    return await executeQuery(query, params)
  } catch (error) {
    logger.error(`MySQL UPDATE 오류 : ${error.message}`)
    throw error
  }
}

/**
 * DELETE 실행.
 *
 * @param {String} table 삭제를 진행할 테이블명.
 * @param {Object|String} where 삭제 쿼리문에 사용할 조건절.
 * @returns {Promise<any>}
 */
const deleteData = async (table, where) => {
  let query = `DELETE FROM ${table}`
  let params = []

  const whereResult = parseWhere(query, where, params)
  query = whereResult.query
  params = whereResult.params

  return await deleteQuery(query, params)
}

/**
 * DELETE 쿼리 실행.
 *
 * @param {String} query
 * @param {Array} params
 * @returns {Promise<any>}
 */
const deleteQuery = async (query, params) => {
  try {
    return await executeQuery(query, params)
  } catch (error) {
    logger.error(`MySQL DELETE 오류 : ${error.message}`)
    throw error
  }
}

/**
 * MySQL 유틸 모듈.
 *
 * @module db/mysql
 */
const mysql = {
  close,
  connect,
  executeQuery,
  insert,
  insertValues,
  select,
  update,
  deleteQuery,
  deleteData,
}

export { mysql }
