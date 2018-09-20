const $ = require('jquery');
import * as d3 from 'd3';
import * as ut from "../utilities.ts";
import * as timeseries from "../timeseries.ts";
import * as sl from "../sparkline.ts";
import * as tables from "../table.ts";

export const build = (model_id, fetchJSON)  => {
  const w = 800 * (2 / 3); //Width
  const h = 500 * (2 / 3); //Heigth
  const padding = 40;

  d3.select("#bRun")
    .on("click", async() => {
      $('#varValueMode').text('run');
      const startTime = parseInt($("#varValueFrom").text());
      const finishTime = parseInt($("#varValueTo").text());
      const params = ut.getParameters(String(model_id), false,
      startTime, finishTime);
      const paramsUrl = ut.concatenateParameters(params);
      const url = `/simulate/model/${model_id}/${paramsUrl}`;
      const rawDataset = await fetchJSON(url);
      const dataset = ut.parseDataset(rawDataset, String(model_id));
      const newCurrentTime = String(d3.max(dataset, d => {return d.time}));
      //Draw timeseries in the stock and flow chart
      const currentSelectedVar = $(`#selVarSF`).val();
      const currentVarDisplay = $('#selVarSF option:selected').text();
      let x = dataset.map(d => d.time);
      let y = dataset.map(d => d[currentSelectedVar]);
      let length = x.length;

      let twoDimensionDataset = [];
      for (let i = 0; i < length; i++) {
        let temp = {
          'x' : x[i],
          'y' : y[i]
        };
        twoDimensionDataset.push(temp);
      }

      let currentDatasets = [];
      let tsDataset = [];
      if($('#cbComparative').is(":checked")){
        currentDatasets = d3.selectAll('.tsSF').data();
        currentDatasets.forEach(dataset => {
          tsDataset.push(dataset);
        });
      }

      d3.selectAll(".tsSF").remove();
      tsDataset.push(twoDimensionDataset)
      let options = {
        'dataset': tsDataset,
        'svgId': "svgTSSF",
        'padding': padding,
        'w': w,
        'h': h,
        'title': currentVarDisplay,
        'finishTime': finishTime,
        'lineDuration': 2000,
        'idLine': 'SFline',
        'classLine': 'tsLine tsSF',
      }
      timeseries.drawLine(options);

      //Draw timeseries in the parameter chart
      x = dataset.map(d => d.time);
      y = dataset.map(d => d.netReproductionNumber);
      length = x.length;

      twoDimensionDataset = [];
      for (let i = 0; i < length; i++) {
        let temp = {
          'x' : x[i],
          'y' : y[i]
        };
        twoDimensionDataset.push(temp);
      }

      currentDatasets = [];
      tsDataset = [];
      if($('#cbComparative').is(":checked")){
        currentDatasets = d3.selectAll('.tsPar').data();
        currentDatasets.forEach(dataset => {
          tsDataset.push(dataset);
        });
      }

      d3.selectAll('.tsPar').remove();

      tsDataset.push(twoDimensionDataset)

      options = {
        'dataset': tsDataset,
        'svgId': "svgTSPar",
        'padding': padding,
        'w': w,
        'h': h / 2,
        'title': 'Net reproduction number',
        'finishTime': finishTime,
        'lineDuration': 2000,
        'idLine': 'parLine',
        'classLine': 'tsLine tsPar',
      }
      timeseries.drawLine(options);

      /*
      Run button - Sparklines
      */
      d3.selectAll(".svgSparkline").remove();
      const parentId = 'divSL';

      let splWidth = 250;
      let splHeight = 25
      let splPadding = {
        'top': 2,
        'left': 0,
        'right': 130,
        'bottom': 2
       }

       const variableList = [
         {'name': 'sSusceptible', 'display': 'Susceptible'},
         {'name': 'sInfected', 'display': 'Infected'},
         {'name': 'sRecovered', 'display': 'Recovered'},
         {'name': 'IR', 'display': 'Infection-Rate'},
         {'name': 'RR', 'display': 'Recovery-Rate'}]

      let arrayLength = variableList.length;

      for (let i = 0; i < arrayLength; i++) {
        let splVariable = variableList[i].display;
        x = dataset.map(d => d.time);
        y = dataset.map(d => d[variableList[i].name]);
        length = x.length;
        let splDataset = [];

        for (let i = 0; i < length; i++) {
          let temp = {
            'x' : x[i],
            'y' : y[i]
          };
          splDataset.push(temp);
        }

        let svgSparkLineId = `splSVG${splVariable}`;
        const optionsCrtSpl = {
          'parentId' : parentId,
          'height'   : splHeight,
          'width'    : splWidth,
          'padding'  : splPadding,
          'dataset'  : splDataset,
          'variable' : splVariable,
          'svgId'    : svgSparkLineId,
          'duration' : 1,
          'delay'    : 2000,
          'finishTime': finishTime,
        };

        sl.createSparkline(optionsCrtSpl);
        let superDataset = [];
        superDataset.push(splDataset);

        let optionsClickEvent = {
          'dataset': superDataset,
          'svgId': "svgTSSF",
          'padding': padding,
          'w': w,
          'h': h,
          'title': splVariable,
          'finishTime': finishTime,
          'lineDuration': 2000,
          'idLine': 'SFline1',
          'classLine': 'tsLine tsSF',
        }
        sl.addOnClickEvent(svgSparkLineId, timeseries.drawLine,
          optionsClickEvent);
      }
      $('#varValueCurTim').text(newCurrentTime);
      const totalPop = parseInt(params.S) + parseInt(params.I) +
        parseInt(params.R);
      const paramsTbl = {
        'modelId': model_id,
        'tableId': 'tblCurrentSim',
        'rowElements': {
          'Population': totalPop,
          'Initial_infected': params.I,
          'Infectivity': params.ift,
          'Contact_rate': params.cr,
          'Time_to_recover': params.rd,
          'startTime': params.startTime,
          'stopTime': params.stopTime
        }
      }

      tables.addRowCurrentSim(paramsTbl);
    });
}