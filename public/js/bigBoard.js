$(document).ready(function() {
	$('a.open-game').on('click', function(e) {
		e.preventDefault();

		var gameId = $(this).data('gameId');

		$.get($(this).attr('href'), function(data) {
			$('#modal div#away-team').find('div.name, div.batters, div.pitchers').empty();
			$('#modal div#home-team').find('div.name, div.batters, div.pitchers').empty();

			$('div#modal div#away-team div.name').text(data.game.away.team.name);
			$('div#modal div#home-team div.name').text(data.game.home.team.name);

			data.game.away.batters.sort(playerAlphabeticalSort).forEach(function(batter) {
				if (data.alreadyPicked.indexOf(batter._id) != -1) {
					$('div#modal div#away-team div.batters').append(
						$('<span>').text(batter.name)
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
				if (data.alreadyPicked.indexOf(batter._id) != -1) {
					$('div#modal div#home-team div.batters').append(
						$('<span>').text(batter.name)
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

			/*
			data.game.away.pitchers.sort(playerAlphabeticalSort).forEach(function(pitcher) {
				$('div#modal div#away-team div.pitchers').append(pitcher.name).append($('<br />'));
			});

			data.game.home.pitchers.sort(playerAlphabeticalSort).forEach(function(pitcher) {
				$('div#modal div#home-team div.pitchers').append(pitcher.name).append($('<br />'));
			});
			*/

			$('#modal').dialog({
				hide: 'fade',
				modal: true,
				position: {
					my: 'center',
					at: 'center',
					of: window
				},
				resizable: false,
				show: 'fade',
				title: data.game.away.team.teamName + ' at ' + data.game.home.team.teamName,
				width: 380
			});
		});
	});

	$('div#modal').on('click', 'a.make-pick', function(e) {
		e.preventDefault();

		var gameId = $(this).data('gameId');

		$.post($(this).attr('href'), function(data) {
			if (data.success) {
				$('#modal').dialog('close');
				$('table a[data-game-id=' + gameId + ']').text(data.player.name);
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
