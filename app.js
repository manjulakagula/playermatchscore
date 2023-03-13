const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());

let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
  }
};

initializeDbAndServer();

//Returns a list of all the players in the player table
//API 1

app.get("/players/", async (request, response) => {
  const playerQuery = `
    SELECT 
    player_id as playerId,
    player_name as playerName
    FROM 
    player_details;`;

  const playerResponse = await database.all(playerQuery);
  response.send(playerResponse);
});

//Returns a specific player based on the player ID
//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const playerDetailsQuery = `
    SELECT 
    player_id as playerId,
    player_name as playerName
    FROM 
    player_details
    WHERE player_id = ${playerId};`;

  const playerDetailsResponse = await database.get(playerDetailsQuery);

  response.send(playerDetailsResponse);
});

//Updates the details of a specific player based on the player ID
//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const { playerName } = request.body;

  const playerNameQuery = `
    UPDATE 
    player_details
    SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId};`;

  await database.run(playerNameQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const matchDetailsQuery = `
    SELECT 
    match_id as matchId,
    match as match,
    year as year
    FROM 
    match_details
    WHERE match_id = ${matchId};`;

  const matchDetailsResponse = await database.get(matchDetailsQuery);
  response.send(matchDetailsResponse);
});

//Returns a list of all the matches of a player
//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const playerMatchDetailsQuery = `
    SELECT 
    match_id as matchId,
    match as match,
    year as year
    FROM 
    player_match_score
    NATURAL JOIN match_details
    WHERE 
    player_id = ${playerId};`;

  const playerDetailsResponse = await database.all(playerMatchDetailsQuery);

  response.send(playerDetailsResponse);
});

//Returns a list of players of a specific match
//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const takingPlayerId = `
    SELECT 
    player_id as playerId,
    player_name as playerName
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;

  const playerIdResponse = await database.all(takingPlayerId);

  response.send(playerIdResponse);
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const totalScoresQuery = `
   SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes 
    FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;

  const totalScoreResponse = await database.get(totalScoresQuery);
  response.send(totalScoreResponse);
});

module.exports = app;
