const $ = require('jquery');
import * as templates from '../../templates/main.ts'
import * as interfaces from '../../interfaces/interfaces.ts'

export const onGameCreated = (socket) => {
  socket.on('game created', payload => {
    const gameId = payload.gameId;
    console.log('The game has been created');
    $('#instructorModal').modal('hide');
    $('#instructorModal').on('hidden.bs.modal', e => {
      window.location.hash = `#instructor/${gameId}`;
    });
  });
}

export const onDescriptionGiven = (socket) => {
  socket.on('game details sent', payload => {
    console.log('Team names have been sent');
    console.log(payload);
    templates.instructor.setup(payload);
    const intInstructor = interfaces.instructor();
    //Must combine into one function
    intInstructor.build.setupScreen(socket);
  });
}

export const onPlayerAdded = (socket) => {
  socket.on('player added', payload => {
    console.log('Received message: player added');
    console.log(payload);
    templates.instructor.addPlayer(payload);
  });
}

export const onGameStarted = (socket) => {
  socket.on('game started', payload => {
    console.log('game has started');
    templates.instructor.controlInterface();
    const intInstructor = interfaces.instructor();
    intInstructor.clickSendMessage(socket);
    intInstructor.pressAnyKey();
  })
}

export const onMessage = (socket) => {
  socket.on('message', payload => {
    console.log(payload);
    templates.instructor.chatMessage(payload);
  })
}
