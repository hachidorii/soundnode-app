"use strict";

var gui = require('nw.gui'),
    uiFrame = {},
    OAuthVerification = {},
    OAuthVerificationId,
    appGUI = {},
    appSystem = {},
    appUser = {};

/**
 * Responsible to verify if user was authenticated
 */
OAuthVerification.init = function () {
    var that = this, popUp;

    if ( appUser.checkAuth() ) {
       this.startApp();
       return;
    }

    popUp = window.open('http://sc-redirect.herokuapp.com/', '_blank', 'screenX=0,screenY=0,width=50,height=50');

    OAuthVerificationId = window.setInterval(function () {
        that.verification(popUp);
    }, 1500);
};

OAuthVerification.verification = function (popUp) {
    var isOAuthDone;

    console.log('verification called');

    if (popUp.document.body !== null) {
        isOAuthDone = popUp.document.body.getAttribute('data-isOAuth-done');
    }

    if (isOAuthDone !== 'true') {
        return;
    }

    // Expose Soundcloud API to node-webkit object window
    window.SC = popUp.SC;
    window.scAccessToken = popUp.SC.accessToken();
    window.scClientId = popUp.SC.options.client_id;

    // close popUp
    popUp.close();
    // stop verification
    window.clearInterval(OAuthVerificationId);

    // save user to localStorage
    appUser.saveUser();

    console.log('verification done');

    // start the App
    this.startApp();
};

OAuthVerification.startApp = function () {
    setTimeout(function() {
        angular.bootstrap(document, ['App']);
        document.body.setAttribute('data-isVisible', 'true');

        appSystem.navBarUserAuthenticated();
    }, 2000)
};

appUser.checkAuth = function(popUp) {

    if( ! window.localStorage.SC ) {
        console.log('User not saved');
        return false;
    }

    console.log('User is saved');

    // Make Information Readable
    window.SC = window.localStorage.SC;
    window.scAccessToken = window.localStorage.scAccessToken;
    window.scClientId = window.localStorage.scClientId;

    // Bring Soundnode to focus
    window.focus();

    return true;
};

appUser.saveUser = function() {
    console.log('Saving user to localStorage');
    // Save all to localStorage
    window.localStorage.SC = window.SC;
    window.localStorage.scAccessToken = window.SC.accessToken();
    window.localStorage.scClientId = window.SC.options.client_id;

    console.dir('window.localStorage.SC', window.localStorage.SC)
};

appUser.windowState = function() {
    if(window.localStorage.width || window.localStorage.height) {
        gui.Window.get().width = Math.round(window.localStorage.width);
        gui.Window.get().height = Math.round(window.localStorage.height);
    }

    gui.Window.get().on('resize', function(width, height) {
        appUser.saveWindow(width, height);
    });
};

appUser.saveWindow = function(width, height) {
    if(width || height) {
        window.localStorage.width = Math.round(width);
        window.localStorage.height = Math.round(height);
    }
};

appSystem.navBarUserUnAuthenticated = function() {
    if (process.platform !== "darwin") {
        return false;
    }

    var nativeMenuBar = new gui.Menu({ type: "menubar" });

    // OS X Menu
    nativeMenuBar = new gui.Menu({ type: "menubar" });

    nativeMenuBar.createMacBuiltin("Soundnode", {
        hideEdit: false,
        hideWindow: false
    });

    appGUI.getGUI.menu = nativeMenuBar;
};

appSystem.navBarUserAuthenticated = function() {
    if (process.platform !== "darwin") {
        return false;
    }

    var nativeMenuBar = new gui.Menu({ type: "menubar" }),
        file = new gui.Menu(),
        playback = new gui.Menu(),
        help = new gui.Menu(),
        playerElement = document.querySelector('[ng-controller=PlayerCtrl]'),
        playerScope = angular.element(playerElement).scope();

    // For Volume
    player.elPlayer = document.getElementById('player');

    // OS X Menu
    nativeMenuBar = new gui.Menu({ type: "menubar" });

    nativeMenuBar.createMacBuiltin("Soundnode", {
        hideEdit: true,
        hideWindow: false
    });

    // File Menu
    nativeMenuBar.insert(
        new gui.MenuItem({
            label: 'File',
            submenu: file
        }), 1
    );

    // Seperator
    file.append (
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // Logout
    file.append(
        new gui.MenuItem({
            label: 'Logout',
            click: function() {
                SC.disconnect();
                appGUI.close();
            },
            key: "w",
            modifiers: "cmd+shift"
        })
    );

    // Playback Menu
    nativeMenuBar.append(
        new gui.MenuItem({
            label: 'Playback',
            submenu: playback
        })
    );

    // Play/Pause
    playback.append(
        new gui.MenuItem({
            label: 'Play',
            click: function() {
                if(this.label === "Play") {
                    playerScope.playPause();
                    this.label = "Pause";
                } else {
                    playerScope.playPause();
                    this.label = "Play";
                }
            }
        })
    );

    // Seperator
    playback.append(
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // Next
    playback.append(
        new gui.MenuItem({
            label: 'Next',
            click: function() {
                playerScope.nextSong();
            },
            key: String.fromCharCode(29),
            modifiers: "cmd"
        })
    );

    // Previous
    playback.append(
        new gui.MenuItem({
            label: 'Previous',
            click: function() {
                playerScope.prevSong();
            },
            key: String.fromCharCode(28),
            modifiers: "cmd"
        })
    );

    // Seperator
    playback.append(
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // Help Menu
    nativeMenuBar.append(
        new gui.MenuItem({
            label: 'Help',
            submenu: help
        })
    );

    // Soundnode Help
    help.append(
        new gui.MenuItem({
            label: 'Soundnode Help',
            click: function() {
                gui.Shell.openExternal('https://github.com/Soundnode/soundnode-app/wiki/Help');
            }
        })
    );

    // Seperator
    help.append (
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // Licenses
    help.append(
        new gui.MenuItem({
            label: 'Licenses',
            click: function() {
                gui.Shell.openExternal('https://github.com/Soundnode/soundnode-app');
            }
        })
    );

    // Seperator
    help.append (
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // DevTools
    help.append(
        new gui.MenuItem({
            label: 'Developer Tools',
            click: function() {
                appGUI.openDevTools();
            }
        })
    );

    appGUI.getGUI.menu = nativeMenuBar;

};

/**
 * Responsible to add GUI events
 */

// Store the GUI window
appGUI.getGUI = gui.Window.get();

// close the App
appGUI.close = function () {
    var guiWin = this.getGUI;
    if (process.platform !== "darwin") {
        guiWin.close(true);
    }
    else {
        guiWin.hide();
    }
};

// minimize the App
appGUI.minimize = function () {
    var guiWin = this.getGUI;
    guiWin.minimize();
};

// maximize the App
appGUI.maximize = function () {
    var guiWin = this.getGUI;
    guiWin.maximize();
};

// reopen the App, this is OS X specific
gui.App.on('reopen', function() {
    var guiWin = appGUI.getGUI;
    guiWin.show();
});

// open dev tools
appGUI.openDevTools = function () {
    var guiWin = gui.Window.get();
    guiWin.showDevTools();
};

//appGUI.openDevTools();

/**
 * Responsible to enable all UI frame actions
 */
uiFrame.init = function () {
    // this.OpenDevTools();
    this.addGUIeventHandlers();
};

uiFrame.addGUIeventHandlers = function () {
    // Get the current window
    var elCloseApp = document.getElementById('closeApp'),
        elMinimizeApp = document.getElementById('minimizeApp'),
        elExpandApp = document.getElementById('expandApp');

    // Close App
    $(elCloseApp).on('click', function () {
        appGUI.close();
    });

    // Minimize App
    $(elMinimizeApp).on('click', function () {
        appGUI.minimize();
    });

    // Expand App
    $(elExpandApp).on('click', function () {
        appGUI.maximize();
    });

};


// Initialize modules
uiFrame.init();
OAuthVerification.init();
appSystem.navBarUserUnAuthenticated();
appUser.windowState();
