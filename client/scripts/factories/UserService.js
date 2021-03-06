angular
  .module('myApp')
  .factory('UserService', ['$http', '$location', function($http, $location){
    // let userObject = new User(); // instantiate a new userObject on factory load
    let userObject = {
      username: '',
      firstName: '',
      lastName: '',
      phone: '',
      invitesArray: [],
      teamsArray: []
    };
    let currentTeamObject = {
      team_id: '',
      name: '',
      manager: false, // set to true in all-teams if player is a manager
      gamesArray: []
    };

    //--------AUTHENTICATION--------
    // login an existing user
    function loginUser(tempUser) {
      return $http.post('/', tempUser).then(function(response) {
        if (response.data.username) { // login successful
          userObject.username = response.data.username;
          if (response.data.first_name) {
            userObject.firstName = response.data.first_name;
          }
          if (response.data.last_name) {
            userObject.lastName = response.data.last_name;
          }
          if (response.data.phone) {
            userObject.phone = response.data.phone;
          }
          return true; // logged in
        } else { // login NOT successful
          return false; // failed login
        }
      });
    } // end login()

    // register a new user
    function registerUser(tempUser) {
      return $http.post('/register', tempUser);
    } // end registerUser()

    // verify user authentication
    function getUser() {
      $http.get('/user').then(function(response) {
        if (!response.data.username) {
          redirectToHome();
        } else {
          userObject.username = response.data.username;
          if (response.data.first_name) {
            userObject.firstName = response.data.first_name;
          }
          if (response.data.last_name) {
            userObject.lastName = response.data.last_name;
          }
          if (response.data.phone) {
            userObject.phone = response.data.phone;
          }
        }
      });
    } // end getUser()

    // logout the user
    function logout() {
      $http.get('/user/logout').then(function(response) {
        clearCurrentUser(); // clear userObject data
        clearCurrentTeam(); // clear currentTeamObject data
        redirectToHome();
      });
    } // end logout()
    //--------END AUTHENTICATION--------

    //-------'/invite' ROUTE----------
    // get user's team invites
    function getUsersInvites() {
      userObject.invitesArray = [];
      return $http.get('/invite').then(function(response) {
        let allInvites = response.data.rows;
        if (allInvites.length) { // user has team invitations
          userObject.invitesArray = allInvites;
          return true;
        } else { // no team invitations
          return false;
        }
      });
    } // end getUsersInvites()

    // accept an invitation to join a team (delete from invites table)
    function acceptInvite(teamId) {
      return $http.delete('/invite/' + teamId);
    } // end acceptInvite()

    // post a player to the 'invites' table
    // @TODO TRIGGER E-MAIL SENT ON THIS ROUTE
    function invitePlayer(inviteObject) {
      return $http.post('/invite', inviteObject).then(function(response) {
        alert('Success! An e-mail will be sent to ' + inviteObject.email + ' inviting them to join your team.');
      });
    } // end invitePlayer
    // -------END '/invite' ROUTE------

    // --------'/teams' ROUTES--------
    // get users teams from the "teams" table in the database
    function getUsersTeams() {
      userObject.teamsArray = [];
      return $http.get('/teams').then(function(response) {
        let allTeams = response.data.rows;
        if (allTeams.length) { // user has teams
          userObject.teamsArray = allTeams;
          return true;
        } else { // user doesn't have any teams
          return false;
        }
      });
    } // end getUsersTeams()

    // add a player to the users_teams table
    function addPlayerToTeam(teamObject) {
      return $http.post('/teams/add-player', teamObject);
    } // end addPlayerToTeam()

    // post new team to the "teams" table
    function addNewTeam() {
      return $http.post('/teams', currentTeamObject).then(function(response) {
        let newTeamId = response.data.rows[0].id; // DB returns the ID of the team that was created
        currentTeamObject.team_id = newTeamId; 
        alert('New team successfully created! Now add some games and invite some players to join your team');
        return currentTeamObject;
      });
    } // end addNewTeam()
    // --------END '/teams' ROUTES--------

    // --------'/games' ROUTES--------  
    // get all of the games for a team by team_id
    function getCurrentTeamsGames() {
      currentTeamObject.gamesArray = [];
      let teamId = currentTeamObject.team_id;
      return $http.get('/games/' + teamId).then(function(response) {
        let gamesArray = response.data.rows;
        if (gamesArray.length) {
          currentTeamObject.gamesArray = gamesArray;
          convertGameDatesAndTimes();
          return true;
        } else {
          return false;
        }
      });
    } // end getUsersTeams()

    // post new game to the "games" table & add the team's players to the "users_games" table
    function addNewGame(gameObject) {
      return $http.post('/games', gameObject);
        // @TODO add all players on the team to new game in users_games table
        // shoul probably be in the .then chain of the AddGameController
        // before the .then(redirectToTeamSchedule)
    } // end addNewGame()

    // --------END '/games' ROUTES--------

    // --------SUPPORT FUNCTIONS----------
    function convertGameDatesAndTimes() {
      for (let gameObject of currentTeamObject.gamesArray) {
        gameObject.date = moment(gameObject.date).format('dddd, MMMM Do YYYY');
        gameObject.time = moment(gameObject.time, 'HH:mm:ss').format('h:mm A');
      }
    }

    function adjustGameDateAndTime(gameObject) {
      gameObject.date = moment(gameObject.date).format('YYYY-MM-DD');
      gameObject.time = moment(gameObject.time).format('HH:mm');
      return gameObject;
    }

    function clearCurrentUser() {
      userObject.username = '';
      userObject.firstName = '';
      userObject.lastName = '';
      userObject.phone = '';
      userObject.teamsArray = [];
    }

    function clearCurrentTeam() {
      currentTeamObject.team_id = '';
      currentTeamObject.name = '';
      currentTeamObject.manager = false;
      currentTeamObject.gamesArray = [];
    }

    function setCurrentTeamInfo(teamObject) {
      currentTeamObject.team_id = teamObject.team_id;
      currentTeamObject.name = teamObject.name;
      currentTeamObject.manager = teamObject.manager;
      currentTeamObject.gamesArray = [];
    }
    //-----END SUPPORT FUNCTIONS--------

    //----------REDIRECTS--------------
    function redirectToLogin() {
      $location.path('/login');
    }

    function redirectToAllTeams() {
      $location.path('/all-teams');
    }

    function redirectToTeamSchedule() {
      $location.path('/team-schedule');
    }

    function redirectToHome() {
      $location.path('/home');
    }
    //---------END REDIRECTS-----------

    // @TODO EDIT A TEAM
    // NOT YET USED?
    // edit a team's information in the database
    // function editTeamInfo(teamId) {
    //   console.log('editing team info in the factory for teamId', teamId);
    //   $http.put('/teams/' + teamId).then(function(response) {
    //     console.log('back from DB in editTeamInfo with response:', response);
    //   });
    // } // end editTeamInfo()
    //
    // @TODO DELETE A TEAM
    // // NOT YET USED?
    // // delete a team from the database
    // function deleteTeam(teamId) {
    //   console.log('deleting team in the factory, adios teamId', teamId);
    //   $http.delete('/teams/' + teamId).then(function(response) {
    //     console.log('back from DB in deleteTeam with response:', response);
    //   });
    // } // end deleteTeam()
    // -----END CURRENTLY UNUSED ROUTES-----

    return {
      userObject,
      currentTeamObject,
      clearCurrentTeam,
      addNewTeam,
      getUsersInvites,
      getUsersTeams,
      acceptInvite,
      addPlayerToTeam,
      getCurrentTeamsGames,
      setCurrentTeamInfo,
      adjustGameDateAndTime,
      addNewGame,
      invitePlayer,
      redirectToLogin,
      redirectToTeamSchedule,
      redirectToAllTeams,
      loginUser,
      registerUser,
      getUser,
      logout,
    };
}]);
