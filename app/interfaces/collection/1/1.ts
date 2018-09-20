const $ = require('jquery');
import * as d3 from 'd3';
import * as select from "../../components/select.ts"
import * as timeseries from "../../components/timeseries.ts";
import * as tables from "../../components/table.ts";
import * as sfd from "./sf.ts";
import * as sliders from "./slds.ts"
import * as runButton from '../../components/buttons/run.ts';
import * as stepButton from '../../components/buttons/step.ts';
import * as cld from '../../components/cld.ts';
import * as drawButton from '../../components/buttons/drawCaseStudy.ts';
import * as ut from '../../../helpers/utilities.ts';
// the MathJax core
const MathJax = require("../../../../node_modules/mathjax3/mathjax3/mathjax.js").MathJax;
// Tex input
const TeX = require("../../../../node_modules/mathjax3/mathjax3/input/tex.js").TeX;
// HTML output
const CHTML = require("../../../../node_modules/mathjax3/mathjax3/output/chtml.js").CHTML;
// Use browser DOM
const adaptor = require("../../../../node_modules/mathjax3/mathjax3/adaptors/browserAdaptor").browserAdaptor();
// Register the HTML document handler
require("../../../../node_modules/mathjax3/mathjax3/handlers/html.js").RegisterHTMLHandler(adaptor);


export const buildInterface = async (modelId, fetchJSON) => {
  const w = 800 * (2 / 3); //Width
  const h = 500 * (2 / 3); //Height
  const padding = 40;
  //parameters blank chart
  const items = [
  {'value': 'sSusceptible', 'text': 'Susceptible'},
  {'value': 'sInfected', 'text': 'Infected'},
  {'value': 'sRecovered', 'text': 'Recovered'},
  {'value': 'IR', 'text': 'Infection rate'},
  {'value': 'RR', 'text': 'Recovery rate'}
  ]
  let options = {
    'xmin': 0,
    'xmax': 100,
    'ymin': 0,
    'ymax': 8,
    'w': w,
    'h': h,
    'padding': padding,
    'parentId': 'mainTS',
    'svgId': 'svgTSSF',
    'selectId': 'selVarSF',
    'items': items,
  }
  timeseries.drawChart(options);

  //parameters blank chart
  options = {
    'xmin': 0,
    'xmax': 100,
    'ymin': 0,
    'ymax': 8,
    'w': w,
    'h': h / 2,
    'padding': padding,
    'parentId': 'mainTS',
    'svgId': 'svgTSPar',
    'selectId': 'selVarSF',
    'items': items,
  }
  timeseries.drawChart(options);




  runButton.build(modelId, fetchJSON);
  stepButton.build(modelId, fetchJSON);
  cld.drawCLD('feedbackLoopDiagram');

  const caseStudyData = [
    {'x': 0, 'y': 1},
    {'x': 1, 'y': 3},
    {'x': 2, 'y': 25},
    {'x': 3, 'y': 72},
    {'x': 4, 'y': 222},
    {'x': 5, 'y': 282},
    {'x': 6, 'y': 256},
    {'x': 7, 'y': 233},
    {'x': 8, 'y': 189},
    {'x': 9, 'y': 123},
    {'x': 10, 'y': 70},
    {'x': 11, 'y': 25},
    {'x': 12, 'y': 11},
    {'x': 13, 'y': 4},
  ];
  tables.drawHorizontalTable(caseStudyData, 'caseStudyTable');
  drawButton.build(caseStudyData,'bDraw');
  sfd.buildStockAndFlow();
  select.buildSelects();
  sliders.buildSliders();
  // Insert comment here
  const res = await ut.fetchJSON('/api/user');
  const user = res.user;
  const url = `/scenario/${user}/${modelId}`
  const response = await ut.fetchJSON(url);
  const optionsRtvSvdScn = {
    'tableId': 'tblSavedSim',
    'data': response
  }
  tables.retrieveSavedScenarios(optionsRtvSvdScn);


  // initialize mathjax with with the browser DOM document; other documents are possible
  const html = MathJax.document(document, {
    InputJax: new TeX(),
    OutputJax: new CHTML({
    fontURL: 'https://cdn.rawgit.com/mathjax/mathjax-v3/3.0.0-alpha.4/mathjax2/css/'
    })
   });
   console.time('wrapper');
   // process the document
   html.findMath()
       .compile()
       .getMetrics()
       .typeset()
       .updateDocument();
   console.timeEnd('wrapper');
}