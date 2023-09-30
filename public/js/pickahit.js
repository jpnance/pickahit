$(document).ready(function() {
	$('td.pickable').on('click', function(e) {
		$(this).find('a.open-game').click();
	});

	$('a.open-game').on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();

		$.get($(this).attr('href'), function(data) {
			$('#modal').replaceWith(data);
			$('#modal').modal();
		});
	});

	$('body').on('click', 'a.make-pick', function(e) {
		e.preventDefault();

		var gameId = $(this).data('gameId');

		$.post($(this).attr('href'), function(data) {
			if (!data.success) {
				if (data.redirect) {
					window.location.href = data.redirect;
				}

				return;
			}

			$('#modal').modal('hide');

			$(`#game-${gameId} .card`).addClass('border-secondary');
			$(`a.team-button[data-game-id=${gameId}]`).addClass('btn-secondary').addClass('text-white').removeClass('btn-outline-secondary');
			$('a.team-button[data-game-id=' + gameId + '] span').text(data.player.name);
		});
	});

	$('form[name=login]').on('click', 'button', function(e) {
		var $this = $(e.currentTarget);
		var $form = $($this.parents('form')[0]);

		$this.attr('disabled', true);
		e.preventDefault();

		$.post($form.attr('action'), $form.serializeArray(), function() {
			window.location = '/?success=email-sent';
		}).fail(function(response) {
			if (response.status == 400) {
				window.location = '/?error=invalid-email';
			}
			else if (response.status == 404) {
				window.location = '/?error=not-found';
			}
			else {
				window.location = '/?error=unknown';
			}
		});
	});
});
