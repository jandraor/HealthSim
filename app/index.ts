import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap-social/bootstrap-social.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import '../node_modules/bootstrap-slider/dist/css/bootstrap-slider.min.css';
import '../node_modules/bootstrap-select/dist/css/bootstrap-select.min.css';
import 'bootstrap';
import * as templates from './templates/main.ts';
import * as interfaces from './interfaces/interfaces.ts';
import * as display from './helpers/display.ts'
import * as ut from './helpers/utilities.ts';
import * as gameEvents from './game_events/main.ts'
import './css/styles.css';

const getAvailableModels = async () => {
  const models = await ut.fetchJSON('/model-info/available');
  if (models.error) {
    throw models.error;
  }
  return models;
};

const drawInterface = (modelId, modelName) => {
  templates.getTemplate(modelId, modelName);
  interfaces.getContent(modelId, ut.fetchJSON);
};

/**
 * Use Window location hash to show the specified view.
 */
let socket = "";
const showView = async() => {
  const mainElement = document.body.querySelector('.hs-main');
  const [view, ...params] = window.location.hash.split('/');

  switch(view) {
    case '#welcome':
      const session = await ut.fetchJSON('/api/session');
      mainElement.innerHTML = templates.welcome({session});

      if (session.error) {
        ut.showAlert(session.error);
      }
    break;

    case '#explore':
      try {
        if(params[0] === 'r'){ //reconstruct
          const session = await ut.fetchJSON('/api/session');
          document.body.innerHTML = templates.mainLayout(session);
        }
        const availableModels = await getAvailableModels();
        display.listAvailableModels(templates, availableModels);
      } catch (err) {
        ut.showAlert(err);
        window.location.hash = '#welcome';
      }
    break;

    case '#play':
      try {
        const io = require('socket.io-client');
        socket = io();
        display.listPlayOptions(socket);
      } catch (err) {
        ut.showAlert(err);
        window.location.hash = '#welcome';
      }
    break;

    case '#interface':
      try {
        const modelId = params;
        const result_query = await ut.fetchJSON('/model-info/model_name/' + modelId);
        const modelName = result_query[0].model_name;
        drawInterface(modelId, modelName);
      } catch(err) {
        ut.showAlert(err);
        window.location.hash = '#welcome';
      }
    break;

    case '#instructor':
      try {
        const gameId = params[0];
        console.log('socket instructor');
        console.log(socket);
        gameEvents.instructorEmitters.getGameDescription(socket, gameId);
      } catch (err) {
        ut.showAlert(err);
        window.location.hash = '#welcome';
      }
    break;

    case '#player':
      try {
        templates.player.waitingInterface();
      } catch (err) {
        ut.showAlert(err);
        window.location.hash = '#welcome';
      }
    break;

    default:
      // Unrecognised view.
      throw Error(`Unrecognised view: ${view}`);
    }
  };

// Page setup.
(async () => {
  const session = await ut.fetchJSON('/api/session');
  document.body.innerHTML = templates.mainLayout(session);
  window.addEventListener('hashchange', showView);
  showView().catch(err => window.location.hash = '#welcome');
})();
