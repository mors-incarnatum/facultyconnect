
// Mobile menu: show or hide the sidebar links.
var menuButton = document.getElementById('menu-toggle');
var sidebar = document.getElementById('sidebar');

if (menuButton && sidebar) {
    menuButton.addEventListener('click', function () {
        var open = sidebar.classList.toggle('open');
        menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuButton.textContent = open ? 'Close' : 'Menu';
    });
}

// Flash messages can be dismissed.
var flashClose = document.getElementById('flash-close');

if (flashClose) {
    flashClose.addEventListener('click', function () {
        var box = document.getElementById('flash');
        if (box) {
            box.remove();
        }
    });
}

// Register page: warn right away when the email is already taken (uses GET /getCheckEmail).
var emailInput = document.getElementById('register-email');
var emailNote = document.getElementById('email-note');

if (emailInput && emailNote) {
    emailInput.addEventListener('blur', function () {
        var email = emailInput.value.trim();

        if (!email) {
            emailNote.textContent = '';
            return;
        }

        fetch('/getCheckEmail?email=' + encodeURIComponent(email))
            .then(function (response) {
                return response.text();
            })
            .then(function (text) {
                var taken = text.trim() !== '' && text.trim() !== 'null';
                emailNote.textContent = taken ? 'An account with that email address already exists.' : '';
            })
            .catch(function () {
                emailNote.textContent = '';
            });
    });
}