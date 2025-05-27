console.log('inject.js loaded');

function findSCUserId() {
  return window.__sc_hydration.find((i) => i.hydratable === 'meUser').data.id;
}

const userId = document.createElement('input');
userId.id = 'spinboxSCUserId';
userId.type = 'hidden';
userId.value = findSCUserId();
console.log('User ID:', userId.value);
document.body.appendChild(userId);

// TODO: need to get client id and access token if possible to use the API.
// temp solution: user enters it in the popup.
// TODO: can this be discovered from the page?
// const clientId = document.createElement('input');
// clientId.id = 'spinboxClientId';
// clientId.type = 'hidden';
// clientId.value = 'unknown';
// document.body.appendChild(clientId);
