'use strict';

const simulate = async (socket, payload, io, gameCollection) => {
  try {
    const gameId = socket.room;
    //Policy matrix file is created
    const writeCsv = require('../../../helpers/csvFiles.js');
    const destinationPath = './R_Models/games/game_1/model/data/'
    writeCsv(payload.policyMatrix, `${destinationPath}PolicyMatrix.csv`);
    const donationFile = `${destinationPath}donations.csv`;
    writeCsv(payload.donations, donationFile)

    //The model is simulated;
    const model = require('../../../modelSimulation/main.js');
    const startTime = payload.startTime;
    const stopTime = payload.finishTime;
    const simulationResult = await model.run(startTime, stopTime);
    const bot = simulationResult.bot; // behaviour over time
    const resultVariables = Object.keys(bot[0]);
    //==========================================================================
    //=======To instructor======================================================
    //==========================================================================
    io.to(`instructor_${gameId}`).emit('simulation result', simulationResult);
    //==========================================================================
    //=======To players======================================================
    //==========================================================================
    const getTeamNames = require('../helpers/getTeamNames.js');
    const teams = getTeamNames(gameId, gameCollection);
    teams.forEach(recipientTeam => {
      const teamVariables = resultVariables.filter(variable => {
        return variable.includes(recipientTeam);
      });
      teamVariables.unshift('time');
      const playerPayload = bot.map(row => {
        const filteredRow = Object.keys(row)
          .filter(variableName => teamVariables.includes(variableName))
          .reduce((obj, variableName) => {
            obj[variableName] = row[variableName];
            return obj;
           }, {});
        return filteredRow;
      });

      io.to(`${recipientTeam}_${gameId}`).emit('simulation result', playerPayload);
    });
  } catch(error) {
    console.log(error);
    throw error
  }
}

module.exports = simulate;
