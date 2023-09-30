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
			$('table#big-board a[data-game-id=' + gameId + ']').text(data.player.name).parent('td').removeClass('unpicked');
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

	$(document).on('keydown', function(e) {
		if (e.originalEvent.keyCode == 35 || e.originalEvent.keyCode == 36) {
			e.preventDefault();

			var bigBoardContainer = document.querySelector('#big-board-container');

			if (e.originalEvent.keyCode == 35) {
				bigBoardContainer.scroll({ left: bigBoardContainer.scrollWidth, behavior: 'smooth' });
			}
			else if (e.originalEvent.keyCode == 36) {
				bigBoardContainer.scroll({ left: 0, behavior: 'smooth' });
			}
		}
	});
});
