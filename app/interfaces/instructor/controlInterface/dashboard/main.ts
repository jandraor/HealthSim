import * as heatmap from './heatmap.ts';
import * as chord from './chordDiagram.ts';
import * as select from './select.ts';
import * as barchart from './barchart.ts';
import * as timeseries from './timeseries.ts';
const $ = require('jquery');
import * as ut from '../../../../helpers/utilities.ts';

export const build = options => {
  heatmap.build(options);
  select.build();
  chord.build();
  barchart.build();
  timeseries.build(options);
}

export const update = resultObj => {
  $('#selRelRes').data('data', resultObj.donations);
  const currentData = $('#selEpiVar').data('results');

  let results;
  if($.isEmptyObject(currentData)) {
    $('#selEpiVar').data('results', resultObj.bot);
    results = resultObj.bot;
  }

  if(!$.isEmptyObject(currentData)) {
    resultObj.bot.shift();
    const updatedData = ut.bindData(currentData, resultObj.bot);
    $('#selEpiVar').data('results', updatedData);
    results = updatedData;
  }

  const variable = $(`#selEpiVar`).val();
  heatmap.update(results, variable);
  timeseries.update(results, variable);
  const resource = $('#selRelRes').val();
  const allDonations = resultObj.donations;
  const oneResourceDonations = allDonations[resource]
  const totalDonations = ut.sumMatrix(oneResourceDonations);
  if(totalDonations === 0){
    chord.empty();
    $('#lTotalDonations').text(0);
    barchart.empty();
    return
  }
  $('#lTotalDonations').text(totalDonations);
  chord.update(oneResourceDonations, allDonations.names_order);
  barchart.update(oneResourceDonations, allDonations.names_order);
}
