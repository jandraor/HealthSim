const $ = require('jquery');
import * as layout from './layout.ts';
import * as prgBar from './progressBar.ts';
import * as dashboard from './dashboard/main.ts';
import * as inputBoard from './inputDecisions/main.ts';

export const build = options => {
  const layoutHtml = layout.html();
  $('body').html(layoutHtml);
  const progressBarHtml = prgBar.html();
  $('#divProgress').html(progressBarHtml);
  inputBoard.build(options);
  dashboard.build(options.yourTeam);
}