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

			['away', 'home'].forEach(function(homeOrAway) {
				var $team = $('div#modal div#' + homeOrAway + '-team');
				$team.find('div.name, div.probable-pitcher, div.batters').empty().show();

				$team.find('div.name').text(data.game[homeOrAway].team.name);

				if (data.game[homeOrAway].probablePitcher) {
					$team.find('div.probable-pitcher').append($('<span>').addClass('position').text(data.game[homeOrAway].probablePitcher.throws + 'HP')).append(data.game[homeOrAway].probablePitcher.name);
				}
				else if (data.game[homeOrAway].batters.length > 0) {
					$team.find('div.probable-pitcher').text('TBD');
				}

				var $bench = $team.find('div.batters.bench');
				var $startingLineup = $team.find('div.batters.starting-lineup');
				var $container = null;

				var startingLineup = data.game[homeOrAway].startingLineup;
				var startingLineupIds = [];
				var batters = data.game[homeOrAway].batters;

				$benchTable = $('<table>');
				$startingLineupTable = $('<table>');

				if (startingLineup && startingLineup.length > 0) {
					$benchTable.append($('<tr>').append($('<th>').attr('colspan', 2).text('Bench')));
					$startingLineupTable.append($('<tr>').append($('<th>').attr('colspan', 2).text('Starting Lineup')));
				}
				else {
					$startingLineup.hide();
				}

				startingLineup.forEach(function(batter) {
					if (batter.position == 'P') {
						return;
					}

					var $row = generatePlayerRow(batter, data.alreadyPicked.indexOf(batter._id) != -1, gameId);
					$startingLineupTable.append($row);
					startingLineupIds.push(batter._id);
				});

				batters.sort(playerAlphabeticalSort).forEach(function(batter) {
					if (startingLineupIds.indexOf(batter._id) != -1) {
						return;
					}
					else {
						var $row = generatePlayerRow(batter, data.alreadyPicked.indexOf(batter._id) != -1, gameId);
						$benchTable.append($row);
					}
				});

				$bench.append($benchTable);
				$startingLineup.append($startingLineupTable);
			});

			$('div#modal div.batters a').addClass('make-pick').attr('data-game-id', gameId);

			$('div#modal h5.modal-title').text(modalTitle(data.game));

			/*
			$('#modal').dialog({
				draggable: true,
				hide: 'fade',
				modal: true,
				position: {
					my: 'center',
					at: 'center',
					of: window
				},
				resizable: false,
				show: 'fade',
				title: modalTitle(data.game),
				width: 480
			});
			*/

			$('#modal').modal();
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

			$('#modal').modal('hide');
			$('table#big-board a[data-game-id=' + gameId + ']').text(data.player?.name || '').parent('td').removeClass('unpicked');
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

var playerAlphabeticalSort = function(a, b) {
	if (a.name < b.name) {
		return -1;
	}
	else if (a.name > b.name) {
		return 1;
	}

	return 0;
};

var generatePlayerRow = function(batter, picked, gameId) {
	var $row = $('<tr>');

	$position = $('<td>').addClass('position').text(batter.position);
	$player = $('<td>').addClass('player');

	if (picked) {
		// $player.addClass('picked').text(batter.name);
		var $playerLink = $('<a>')
			.attr('data-player-id', batter._id)
			.attr('href', '/games/unpick/' + gameId + '/' + batter._id)
			.text(batter.name);

		$player.append($playerLink);
	}
	else {
		var $playerLink = $('<a>')
			.attr('data-player-id', batter._id)
			.attr('href', '/games/pick/' + gameId + '/' + batter._id)
			.text(batter.name);

		$player.append($playerLink);
	}

	$player.append($('<span>').addClass('bats').text('(' + batter.bats + ')'));

	$row.append($position);
	$row.append($player);

	return $row;
}

var modalTitle = function(game) {
	var modalTitle = game.seriesDescription;

	if (game.gamesInSeries > 1) {
		modalTitle += ', Game ' + game.seriesGameNumber;

		if (game.ifNecessary == 'Y') {
			modalTitle += '*';
		}
	}

	return modalTitle;
}
