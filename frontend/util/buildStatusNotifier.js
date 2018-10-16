import io from 'socket.io-client';

module.exports = class BuildStatusNotifier {
  static listen() {
    /* eslint no-undef: "error" */
    /* eslint-env browser */

    if (BuildStatusNotifier.listening) {
      return Promise.resolve();
    }
    BuildStatusNotifier.listening = true;
    return Notification.requestPermission()
    .then((permission) => {
      // If the user accepts, let's create a notification
      if (permission === 'granted') {
        const socket = io();
        socket.on('build status', (build) => {
          this.notify(build);
        });
      }
      return Promise.resolve();
    });
  }

  static notify(build) {
    let titleStatus;
    switch (build.state) {
      case 'error':
        titleStatus = 'Failed Build: Please review logs.';
        break;
      case 'processing':
        titleStatus = 'Build In-Progress';
        break;
      default:
        titleStatus = 'Successful Build';
        break;
    }
    const icon = '/images/favicons/favicon.ico';
    return new Notification(`${titleStatus}`, { body: `Site: ${build.owner}/${build.repository}   Branch: ${build.branch}`, icon });
  }
};
