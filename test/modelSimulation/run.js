const assert = require('chai').assert;
const model = require('../../modelSimulation/main.js');
const csvReader = require('csvtojson');

//single country model
describe('run a simulation step', () => {
  describe('10 countries setup', () => {
    const countriesTemplate = './R_Models/games/game_1/model/data/CountriesTemplate.csv';
    const virusSeverity = 0;
    let result, nTeams, teams, donationCases;
    const policyMatrixPath = "./R_Models/games/game_1/model/data/PolicyMatrix.csv";
    const donationsPath = "./R_Models/games/game_1/model/data/donations.csv";
    const fs = require('fs');

    before(async function()  {
      this.timeout(5000);

      //Avoiding false positives
      //------------------------------------------------------------------------
      if(fs.existsSync(policyMatrixPath)) {
        fs.unlinkSync(policyMatrixPath)
      }

      if(fs.existsSync(donationsPath)) {
        fs.unlinkSync(donationsPath)
      }
      //------------------------------------------------------------------------

      const initConditions = await csvReader().fromFile(countriesTemplate);
      teams = initConditions.map(rowTeam => {return rowTeam.Name});
      initialisationResult = await model.initialise(initConditions, virusSeverity);
      const startTime = 0;
      const stopTime = 1;
      const policyMatrixTemplate = "./R_Models/games/game_1/model/data/10CountryPolicyMatrixTemplate.csv";
      const policyMatrix = await csvReader().fromFile(policyMatrixTemplate);
      const donationsTemplate = "./R_Models/games/game_1/model/data/10CountryDonationsTemplate.csv";
      const donationsInput = await csvReader().fromFile(donationsTemplate);
      // Donation test cases
      //------------------------------------------------------------------------
      donationCases = [
        {
          'resource': 'Antivirals',
          'donations': [
            {'donor': 'Alpha', 'amount': 50},
            {'donor': 'Gamma', 'amount': 20},
            {'donor': 'Theta', 'amount': 10},
          ],
          'recipient': 'Kappa'
        },
        {
          'resource': 'Vaccines',
          'donations': [
            {'donor': 'Theta', 'amount': 15},
            {'donor': 'Alpha', 'amount': 10},
            {'donor': 'Gamma', 'amount': 5},
          ],
          'recipient': 'Epsilon'
        },
        {
          'resource': 'Ventilators',
          'donations': [
            {'donor': 'Epsilon', 'amount': 3},
            {'donor': 'Theta', 'amount': 4},
            {'donor': 'Alpha', 'amount': 5},
          ],
          'recipient': 'Beta'
        },
        {
          'resource': 'Financial',
          'donations': [
            {'donor': 'Delta', 'amount': 15},
            {'donor': 'Alpha', 'amount': 20},
            {'donor': 'Kappa', 'amount': 25},
          ],
          'recipient': 'Iota'
        },
      ]
      donationCases.forEach(donationCase => {
        const resource = donationCase.resource;
        donationCase.donations.forEach(donation => {
          donationsInput.forEach(row => {
            if(row.from === donation.donor && row.to === donationCase.recipient
              && row.resource === resource){
                row.amount = donation.amount;
            }
          });
        });
      });
      //------------------------------------------------------------------------
      result = await model.run(startTime, stopTime, policyMatrix, donationsInput);
      nTeams = 10;
    });

    it(`should create a file named PolicyMatrix.csv`, () => {
      assert(fs.existsSync(policyMatrixPath)) ;
    });

    it(`should create a file named donations.csv`, () => {
      assert(fs.existsSync(donationsPath)) ;
    });

    it(`should return an object`, function() {
      assert.isObject(result);
    });

    it(`should have a 'bot' property`, () => {
      assert.property(result, 'bot');
    });

    let botIsArray;
    it(`'bot' property should be an array`, () => {
      botIsArray = Array.isArray(result.bot);
      assert.isArray(result.bot);
    });

    let allRowsAreObject = false;
    it(`In bot property, each element should be an object`, () => {
      if(botIsArray === false) {
        assert(false, 'bot property is not an array')
      }
      const bot = result.bot;
      const rowValidation = bot.map((row, i) => {
        assert.isObject(row, `row ${i + 1} is not an object`)
      });
      allRowsAreObject = true;
    })

    let equalColNames = false;
    it(`In bot property, all rows should have identical column names`, () => {
      if(allRowsAreObject === false) {
        assert(false, 'Not all rows in bot are objects')
      }
      const bot = result.bot;
      const pivotKeys = Object.keys(bot[0]);
      bot.map(row => {
        const actual = pivotKeys
        const expected = Object.keys(row)
        assert.deepEqual(actual, expected, "Column names different in rows")
      });
      equalColNames = true
    });

    const variables = ['_TotalInfected', '_TotalPopulation', '_TM_I1', '_TM_I2',
      '_TM_IS', '_TM_IQ', '_TM_IAV', '_FM_R', '_AVR_AVS', '_VAC_VS', '_VEN_VS'];

    variables.forEach(variable => {
      it(`In bot property, each object should have the variable "${variable}" for each team`, () => {

        if(botIsArray === false) {
          assert(false, 'bot property is not an array')
        }

        if(allRowsAreObject === false) {
          assert(false, 'Not all rows in bot are objects')
        }

        if(equalColNames === false) {
          assert(false, 'rows have different col names')
        }

        //Since the previous test case proves that all rows have identical column names,
        //testing on only one row is sufficient for the current test case.
        const bot = result.bot
        const row = bot[0];
        teams.map(team => {
          const expected = `${team}${variable}`
          assert.property(row, expected, `${expected} not found`);
        })
      })
    })

    it(`should have a 'donations' property`, () => {
      assert.property(result, 'donations');
    });

    it(`'donations' property should be an object`, () => {
      assert.isObject(result.donations);
    });

    const resources = ['Antivirals', 'Vaccines', 'Ventilators', 'Financial'];

    resources.forEach(resource => {
      it(`'donations' property should have a '${resource}' property`, () => {
        assert.property(result.donations, resource)
      });

      it(`'${resource}' property should be an array`, () => {
        assert.isArray(result.donations[resource])
      });
      //--------------------------------------------------------------------------
      //These tests check whether the property is a square matrix
      let eachElementIsArray;
      it(`each element in "${resource} property is also an array"`, () => {
        const resourceDonations = result.donations[resource];

        if(resourceDonations.length === 0){
          assert(false, 'property empty')
        }

        const rowValidation = resourceDonations.map(row => {
          return Array.isArray(row)
        })

        const eachElementIsArray = rowValidation.indexOf(false) > -1 ? false : true;
        assert(eachElementIsArray, 'each element is not an array')
      });

      let identicalCols;
      it(`In ${resource} property, the number of cols in each row is identical`, () => {
        const resourceDonations = result.donations[resource];
        if(resourceDonations.length === 0){
          assert(false, 'property empty')
        }

        if(eachElementIsArray === false) {
          assert(false, 'each element is not an array');
        }

        const colNum = resourceDonations.map(row => {
          return row.length;
        });
        identicalCols = colNum.every( (val, i, arr) => val === arr[0] )
        assert(identicalCols, 'the number of cols is not identical in each row')
      });

      let isSquareMatrix;

      it(`the number of columns and rows in "${resource} property should be equal"`, () => {
        const resourceDonations = result.donations[resource];
        if(resourceDonations.length === 0){
          assert(false, 'property empty')
        }

        if(identicalCols === false){
          assert(false, 'this test cannot be performed unless the number of cols is identical in each row')
        }

        const rows = resourceDonations.length;
        const cols = resourceDonations[0].length;
        isSquareMatrix = rows === cols ? true : false;
        assert(isSquareMatrix, "It is not a square matrix");
      })
      //--------------------------------------------------------------------------
      it(`In ${resource},the square matrix order should be equal to the number of teams`, () => {
        const resourceDonations = result.donations[resource];
        if(isSquareMatrix === false) {
          assert(false, "It is not a square matrix");
        }
        const actual = resourceDonations.length;
        const expected = nTeams;
        assert.equal(actual, expected);
      })

      it(`In ${resource}, the square matrix diagonal should be 0`, () => {
        const resourceDonations = result.donations[resource];
        if(isSquareMatrix === false) {
          assert(false, "It is not a square matrix");
        }
        const diagonal = resourceDonations.map((row, i) => {
          return row[i]
        });
        const sum = diagonal.reduce((lastValue, currentValue) => {
          return lastValue + Math.pow(currentValue, 2)
        }, 0)

        const expected = 0;
        const actual = sum;
        assert.strictEqual(actual,expected)
      });

      it(`The sum of ${resource} donations in the csv file should match the sum
        returned by the model`, () => {
        if(isSquareMatrix === false) {
          assert(false, "It is not a square matrix");
        }
        const resourceDonations = result.donations[resource];
        const filteringResult = donationCases.filter(donationCase => {
          return donationCase.resource === resource;
        });
        const donationCase = filteringResult[0]
        const expected = donationCase.donations.map(donation => {
          return donation.amount
        }).reduce((lastVal, curVal) => {return lastVal + curVal}, 0) ;
        const recipient = donationCase.recipient;
        const namesOrder = result.donations.names_order
        const index = namesOrder.indexOf(recipient);
        const actual = resourceDonations[index]
          .reduce((lastVal, curVal) => {return lastVal + curVal}, 0)
        assert.equal(actual, expected);
      });
    });

    it(`'donations' property should have a 'names_order' property`, () => {
      assert.property(result.donations, 'names_order')
    });

    it(`"names_order" property should be an array`, () => {
      assert.isArray(result.donations.names_order)
    });

    it(`The length of "names_order" should be equal to the number of teams`, () => {
      const actual = result.donations.names_order.length;
      const expected = nTeams
      assert.equal(actual, expected)
    })
  });



})
