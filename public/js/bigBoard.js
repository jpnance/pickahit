$(document).ready(function() {
	$('a.open-game').on('click', function(e) {
		e.preventDefault();

		$.get($(this).attr('href'), function(data) {
			$('#modal div#away-team').find('div.name, div.batters, div.pitchers').empty();
			$('#modal div#home-team').find('div.name, div.batters, div.pitchers').empty();

			$('div#modal div#away-team div.name').text(data.away.team.name);
			$('div#modal div#home-team div.name').text(data.home.team.name);

			data.away.batters.sort(playerAlphabeticalSort).forEach(function(batter) {
				$('div#modal div#away-team div.batters').append(batter.name).append($('<br />'));
			});

			data.home.batters.sort(playerAlphabeticalSort).forEach(function(batter) {
				$('div#modal div#home-team div.batters').append(batter.name).append($('<br />'));
			});

			/*
			data.away.pitchers.sort(playerAlphabeticalSort).forEach(function(pitcher) {
				$('div#modal div#away-team div.pitchers').append(pitcher.name).append($('<br />'));
			});

			data.home.pitchers.sort(playerAlphabeticalSort).forEach(function(pitcher) {
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
				title: data.away.team.teamName + ' at ' + data.home.team.teamName,
				width: 380
			});
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
