const $ = require('jquery');
import * as d3 from 'd3';
import * as templates from '../../templates/main.ts'
import * as interfaces from '../../interfaces/interfaces.ts'

export const listAvailableGames = (socket) => {
  socket.on('current games', (gamesObject) => {
    console.log(gamesObject);
    if(gamesObject.n_Games === 0){
      d3.select('#divListGames')
        .text('No games available');
    }

    if(gamesObject.n_Games > 0){
      d3.select('#divListGames').html('');
      const table = d3.select('#divListGames').append('table')
        .attr('class', 'mx-auto');
      const headers = ['Instructor', 'Team', 'Action']
      const thead = table.append('thead');
      const tbody = table.append('tbody');
      const ncols = headers.length;
      const headerRow = thead.append('tr');
      headers.forEach(elem => {
        headerRow.append('th')
          .attr('class','px-5')
          .text(elem)
      });
      gamesObject.games.forEach(elem => {
        const tr = tbody.append('tr').attr('class', 'text-center');
        tr.append('td').text(elem.instructor);
        const teamsSelect = tr.append('td').append('select')
          .attr('id', `sel${elem.id}`);
        const options = teamsSelect.selectAll("option")
          .data(elem.teams)
          .enter()
          .append("option");

        options.text(d => {
          return d.name;
        })
          .attr("value", d => {
            return d.name;
          });

        const markup = `
          <button class = "btn btn-primary"
            id = "bJoin${elem.id}">Join</button>
        `;
        tr.append('td').attr('class','py-1').html(markup);
        d3.select(`#bJoin${elem.id}`)
          .on('click', () => {
            const joinInfo = {
              'id': elem.id,
              'email': 'healthsimnuig@gmail.com',
              'team': d3.select(`#sel${elem.id}`).property("value"),
            }
            socket.emit('join game', joinInfo);
          });
      });
    }
  });
}

export const onPlayerAdded = (socket)=> {
  socket.on('player added', () => {
    console.log('Player has been added');
    $('#playerModal').modal('hide');
    $('#playerModal').on('hidden.bs.modal', e => {
      window.location.hash = '#player';
    });
  });
}

export const onGameStarted = (socket) => {
  socket.on('game started', message => {
    console.log('received message: game started');
    console.log('hola message');
    console.log(message);
    templates.player.gameInterface(message);
    const intPlayer = interfaces.player();
    // Must update to make only one funcion-------------------------------------
    intPlayer.clickSendMessage(socket);
    intPlayer.pressAnyKey();
    intPlayer.buildGameInterface(message);
    //--------------------------------------------------------------------------
  });
}

export const onMessage = (socket) => {
  socket.on('message', payload => {
    console.log(payload);
    templates.player.chatMessage(payload);
  })
}