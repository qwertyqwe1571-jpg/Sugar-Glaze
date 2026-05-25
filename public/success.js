const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');
const storeMail = params.get('storeMail');
const customerMail = params.get('customerMail');

if (orderId) {
  document.getElementById('orderIdText').textContent = orderId;
  document.getElementById('orderIdBox').hidden = false;
}

if (customerMail === 'sent') {
  document.getElementById('mailStatus').textContent =
    'Лист-підтвердження вже відправлено на вашу пошту.';
} else if (storeMail === 'sent') {
  document.getElementById('mailStatus').textContent =
    'Замовлення збережено і передано магазину.';
}
