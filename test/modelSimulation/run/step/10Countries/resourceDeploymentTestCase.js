const assert = require('chai').assert;
const fs = require('fs');
const model = require('../../../../../modelSimulation/main.js');
const csvReader = require('csvtojson');
const nonNegativeTests = require("../../commonTests/nonNegativeStocks.js");
const basicTests = require("../../commonTests/basic.js");

const test = () => {
  describe('resource deployment', () => {
    const startTime = 0;
    const stopTime = 1;
    const dirPath = './R_Models/games/game_1/model/data/';
    const policyMatrixPath = `${dirPath}PolicyMatrix.csv`;
    const donationsPath = `${dirPath}donations.csv`;
    const countriesTemplate = `${dirPath}CountriesTemplate.csv`;
    const virusSeverity = 0;
    let result, nTeams, teams, alphaUsageFraction;

    before(async function()  {
      this.timeout(10000);
      if(fs.existsSync(policyMatrixPath)) {
        fs.unlinkSync(policyMatrixPath)
      }

      if(fs.existsSync(donationsPath)) {
        fs.unlinkSync(donationsPath)
      }

      const initConditions = await csvReader().fromFile(countriesTemplate);
      teams = initConditions.map(rowTeam => {return rowTeam.Name});
      this.teams = teams;
      const countrySetupTemplate = `${dirPath}country_MOCK_UP_TEMPLATE.csv`;
      const countrySetup = await csvReader().fromFile(countrySetupTemplate);
      //------------------------------------------------------------------------
      // Changes Beta's default value of initial vaccines
      countrySetup.forEach(row => {
        if(row.Name == 'Beta') {
          row.InitVaccineStockpile = row.Susceptible;
        }
      });
      //------------------------------------------------------------------------
      initialisationResult = await model.initialise(initConditions,
        virusSeverity, true, true, countrySetup);
      //========================================================================
      // PolicyMatrix
      //========================================================================
      const policyMatrixTemplate = `${dirPath}10CountryPolicyMatrixTemplate.csv`;
      const policyMatrix = await csvReader().fromFile(policyMatrixTemplate);

      //Alpha attemps to deploy all its antivirals
      alphaUsageFraction = 1;

      policyMatrix.forEach((row, i) => {
        if(i === 0){
          row.AntiviralsUsageFraction = alphaUsageFraction;
        }
      });

      betaUsageFraction = 1;
      // Beta attemps to vaccinate all its individuals
      policyMatrix.forEach((row, i) => {
        if(i === 1){
          row.VaccineUsageFraction = betaUsageFraction;
        }
      });

      //========================================================================
      // Donations
      //========================================================================
      const donationsTemplate = `${dirPath}10CountryDonationsTemplate.csv`;
      const donationsInput = await csvReader().fromFile(donationsTemplate);
      result = await model.run(startTime, stopTime, policyMatrix, donationsInput);
      this.result =  result;
      nTeams = 10;
    });

    basicTests();
    nonNegativeTests.transmissionSector();
    nonNegativeTests.financialSector();
    nonNegativeTests.vaccineSector();
    nonNegativeTests.antiviralSector();
    nonNegativeTests.ventilatorSector();

    it(`Alpha's antiviral stock should be consistent`, () => {
      const bot = result.bot;
      const lastRow = bot[bot.length - 1]; // time === 1
      const firstRow = bot[0] // time === 0;
      const initAntiviralStock = firstRow.Alpha_AVR_AVS;
      const desiredUsage = alphaUsageFraction * initAntiviralStock;
      const initAlphaInfected1 = firstRow.Alpha_TM_I1;
      const expected = initAntiviralStock - Math.min(desiredUsage, initAlphaInfected1)
      const actual = lastRow.Alpha_AVR_AVS
      assert.equal(actual, expected);
    });

    it(`Beta's vaccine stockpile should be nil`, () => {
      const bot = result.bot;
      const lastRow = bot[bot.length - 1]; // time === 1
      const actual = lastRow.Beta_VAC_VS
      const expected = 0;
      assert.equal(actual, expected);
    })

    // --------------------------------------------------------------------------
    // Donations

    const resources = ['Antivirals', 'Vaccines', 'Ventilators', 'Financial'];

    resources.forEach(resource => {
      it(`The sum of all rows in ${resource} donations should be nil`, () => {
        const resourceDonations = result.donations[resource];

        const actual = resourceDonations.map(row => {
          const rowSum = row.reduce((lastVal, curVal) => {
            return lastVal + curVal;
          }, 0)
          return rowSum
        }).reduce((lastVal, curVal) => {
          return lastVal + curVal;
        }, 0);

        const expected = 0;

        assert.equal(actual, expected)
      });
    });
  });
}

module.exports = test;