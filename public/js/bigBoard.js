$(document).ready(function() {
	$('td.pickable').on('click', function(e) {
		$(this).find('a.open-game').click();
	});

	$('a.open-game').on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();

		var gameId = $(this).data('gameId');

		$.get($(this).attr('href'), function(data) {
			if (!data.success) {
				if (data.redirect) {
					window.location.href = data.redirect;
				}

				return;
			}

			$('#modal div#away-team').find('div.name, div.batters, div.pitchers').empty();
			$('#modal div#home-team').find('div.name, div.batters, div.pitchers').empty();

			$('div#modal div#away-team div.name').text(data.game.away.team.name);
			$('div#modal div#home-team div.name').text(data.game.home.team.name);

			data.game.away.batters.sort(playerAlphabeticalSort).forEach(function(batter) {
				$('div#modal div#away-team div.batters').append($('<span>').addClass('position').text(batter.position));

				if (data.alreadyPicked.indexOf(batter._id) != -1) {
					$('div#modal div#away-team div.batters').append(
						$('<span>').addClass('picked').text(batter.name)
					).append($('<br />'));
				}
				else {
					$('div#modal div#away-team div.batters').append(
						$('<a>')
							.attr('data-player-id', batter._id)
							.attr('href', '/games/pick/' + gameId + '/' + batter._id)
							.text(batter.name)
					).append($('<br />'));
				}
			});

			data.game.home.batters.sort(playerAlphabeticalSort).forEach(function(batter) {
				$('div#modal div#home-team div.batters').append($('<span>').addClass('position').text(batter.position));

				if (data.alreadyPicked.indexOf(batter._id) != -1) {
					$('div#modal div#home-team div.batters').append(
						$('<span>').addClass('picked').text(batter.name)
					).append($('<br />'));
				}
				else {
					$('div#modal div#home-team div.batters').append(
						$('<a>')
							.attr('data-player-id', batter._id)
							.attr('href', '/games/pick/' + gameId + '/' + batter._id)
							.text(batter.name)
					).append($('<br />'));
				}
			});

			$('div#modal div.batters a').addClass('make-pick').attr('data-game-id', gameId);

			$('#modal').dialog({
				buttons: [
					{
						click: function() {
							$(this).dialog('close');
						},
						text: 'Done'
					}
				],
				draggable: false,
				hide: 'fade',
				modal: true,
				position: {
					my: 'center',
					at: 'center',
					of: window
				},
				resizable: false,
				show: 'fade',
				width: 480
			});
		});
	});

	$('div#modal').on('click', 'a.make-pick', function(e) {
		e.preventDefault();

		var gameId = $(this).data('gameId');

		$.post($(this).attr('href'), function(data) {
			if (!data.success) {
				if (data.redirect) {
					window.location.href = data.redirect;
				}

				return;
			}

			$('#modal').dialog('close');
			$('table a[data-game-id=' + gameId + ']').text(data.player.name).parent('td').removeClass('unpicked');
		});
	});
});

var playerAlphabeticalSort = function(a, b) {
	if (a.name < b.name) {
		return -1;
	}
	else if (a.name > b.name) {
		return 1;
	}

	return 0;
};
