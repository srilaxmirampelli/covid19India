const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const databasepath = path.join(__dirname, 'covid19India.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

let database = null

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasepath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const stateObjToResponseObj = dbObj => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  }
}

const districtObjToResponseObj = dbObj => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  }
}

// Get States API 1
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state;
    `
  const statesArray = await database.all(getStatesQuery)
  response.send(statesArray.map(stateObjToResponseObj))
})

// Get State ID API 2
app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};
    `
  const state = await database.get(getStateQuery)
  response.send(stateObjToResponseObj(state))
})

// Post District API 3
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO 
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES ("${districtName}", ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
  `
  const districtResponse = await database.run(postDistrictQuery)
  response.send('District Successfully Added')
})

// Get District ID API 4
app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};
    `
  const district = await database.get(getDistrictQuery)
  response.send(districtObjToResponseObj(district))
})

// Delete District ID API 5
app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `
  const district = await database.get(deleteDistrictQuery)
  response.send('District Removed')
})

// Update District API 6
app.put('/districts/:districtId', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const {districtId} = request.params
  const updateDistrictQuery = `
  UPDATE district
  SET 
  district_name = "${districtName}",
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};
  `
  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
})

// Get Statictics API 7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
  SELECT
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)

  FROM district
  WHERE state_id = ${stateId};
  `
  const stats = await database.get(getStatsQuery)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

// Get state name of a particular District API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
  SELECT state_name AS stateName
  FROM state INNER JOIN district ON
  state.state_id = district.state_id;
  `
  const stateNameResponse = await database.get(getStateNameQuery)
  response.send(stateNameResponse)
})

module.exports = app
