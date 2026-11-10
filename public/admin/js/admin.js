const loginForm = document.querySelector('#login-form');
const formMessage = document.querySelector('#form-message');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.textContent = 'El acceso se conectará al servidor en el siguiente paso.';
});
