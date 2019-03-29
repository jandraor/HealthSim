const assert = require('chai').assert;
const fs = require('fs');
const model = require('../../../modelSimulation/main.js');
const csvReader = require('csvtojson');

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
    });

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
    });

    it(`In the transmission sector, all stocks should be non-negative`, () => {
      const bot = result.bot;
      const tm_model_stocks = ["_TM_S","_TM_I1","_TM_I2","_TM_IQ","_TM_IAV",
        "_TM_IS","_TM_RV","_TM_RAV","_TM_RQ","_TM_RNI", "_TM_RAR","_TM_RS",
        "_TM_NRR","_TM_LTM", "_TM_RIR"];

      const tmStocks = [];

      teams.forEach(team => {
        tm_model_stocks.forEach(stock => {
          tmStocks.push(`${team}${stock}`)
        });
      });

      tmStocks.forEach(stock => {
        bot.forEach(row => {
          assert.isAtLeast(row[stock], 0);
        })
      })
    });

    it(`In the financial sector, all stocks should be non-negative`, () => {
      const bot = result.bot;
      const fm_model_stocks = ["_FM_R","_FM_TFRD","_FM_TSOVAC","_FM_TSOA",
        "_FM_TSOVEN","_FM_TFRR"]

      const fmStocks = [];

      teams.forEach(team => {
        fm_model_stocks.forEach(stock => {
          fmStocks.push(`${team}${stock}`)
        });
      });

      fmStocks.forEach(stock => {
        bot.forEach(row => {
          assert.isAtLeast(row[stock], 0);
        })
      })
    });

    it(`In the vaccine sector, all stocks should be non-negative`, () => {
      const bot = result.bot;
      const vac_model_stocks = ["_VAC_VSL","_VAC_VS","_VAC_TVSHR","_VAC_TVR",
        "_VAC_TVD","_VAC_TVS", "_VAC_TVO"]

      const vacStocks = [];

      teams.forEach(team => {
        vac_model_stocks.forEach(stock => {
          vacStocks.push(`${team}${stock}`)
        });
      });

      vacStocks.forEach(stock => {
        bot.forEach(row => {
          assert.isAtLeast(row[stock], 0);
        })
      })
    });

    it(`In the antiviral sector, all stocks should be non-negative`, () => {
      const bot = result.bot;
      const av_model_stocks = ["_AVR_AVSL","_AVR_AVS","_AVR_TAVSHR","_AVR_TAVR",
        "_AVR_TAVD","_AVR_TAVS","_AVR_TAO"]

      const avStocks = [];

      teams.forEach(team => {
        av_model_stocks.forEach(stock => {
          avStocks.push(`${team}${stock}`)
        });
      });

      avStocks.forEach(stock => {
        bot.forEach(row => {
          assert.isAtLeast(row[stock], 0);
        })
      })
    });

    it(`In the ventilator sector, all stocks should be non-negative`, () => {
      const bot = result.bot;
      const ven_model_stocks = ["_VEN_VSL","_VEN_VS","_VEN_VIU","_VEN_TVR",
        "_VEN_TVD","_VEN_TVS","_VEN_TVO"]

      const venStocks = [];

      teams.forEach(team => {
        ven_model_stocks.forEach(stock => {
          venStocks.push(`${team}${stock}`)
        });
      });

      venStocks.forEach(stock => {
        bot.forEach(row => {
          assert.isAtLeast(row[stock], 0);
        })
      })
    });

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

    //--------------------------------------------------------------------------
    //Donations

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

      it(`The sum of all rows in ${resource} donations should be nil`, () => {
        if(isSquareMatrix === false) {
          assert(false, "It is not a square matrix");
        }

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

      it(`'donations' property should have a 'names_order' property`, () => {
        assert.property(result.donations, 'names_order')
      });

      it(`"names_order" property should be an array`, () => {
        assert.isArray(result.donations.names_order)
      });

      it(`The length of "names_order" should be equal to the number of teams`, () => {
        const actual = result.donations.names_order.length;
        const expected = nTeams;
        assert.equal(actual, expected)
      });
    });
  })
}

module.exports = test;
