$(document).ready(function() {
	$('div.right form input[name=username]').focus();

	$('form').on('submit', function(e) {
		e.preventDefault();

		var $form = $(e.target);
		var username = $form.find('input[name=username]').val();
		var password = $form.find('input[name=password]').val();

		if (username != '' && password != '') {
			$.post('/login', { username: username, password: password, justVerify: true }, function(data) {
				$form.addClass('hidden');

				if (data.success) {
					$('div.success').removeClass('hidden').find('span.display-name').text(data.user.displayName);
				}
				else {
					$('div.failure').removeClass('hidden');
				}
			});
		}
	});

	$('a.try-again').on('click', function(e) {
		e.preventDefault();

		$('div.right div').addClass('hidden');
		$('div.right form').removeClass('hidden').find('input').val('');
		$('div.right form input[name=username]').focus();
	});
});
