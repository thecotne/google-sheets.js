var R = require('ramda');
var reqwest = require('reqwest');
var Rx = require('rx');

var sheetId = R.pipe(
	R.prop('link'),
	R.last,
	R.prop('href'),
	R.split('/'),
	R.last
);

var apiUrl = 'https://spreadsheets.google.com/feeds';
var worksheetUrl = key => `${apiUrl}/worksheets/${key}/public/basic?alt=json`;
var sheetsUrl = (key, sheetId) => `${apiUrl}/list/${key}/${sheetId}/public/values?alt=json`;
var getJSON = (url, complete) => reqwest({url, complete, crossOrigin: true});
var startsWith = R.curry((check, str) => str.indexOf(check) == 0);
var isColumn = startsWith('gsx$');
var toColumnName = name => R.slice(4, R.length(name), name);

export function getGoogleSheet(key) {
	return getJSON(worksheetUrl(key))
	.then(R.pipe(
		R.path(['feed', 'entry']),
		R.map(val => {
			return {
				title: val.title.$t,
				link: sheetsUrl(key, sheetId(val))
			}
		})
	))
	.then((sheetsData) => {
		var sheets = new Rx.Subject();
		var countDown = sheetsData.length;

		R.forEachIndexed((worksheet, index) => {
			getJSON(worksheet.link, data => {
				sheets.onNext({
					data,
					index,
					link: worksheet.link,
					title: worksheet.title
				});

				// decrease countDown and check if it's zero
				if (! -- countDown) sheets.onCompleted();
			});
		}, sheetsData);

		return sheets.map((sheet) => {
			var entries = R.path(['data', 'feed', 'entry'], sheet) || [];
			var data = R.map(entry => {
				var row = {};
				R.pipe(
					R.keys,
					R.filter(isColumn),
					R.forEach(key => row[toColumnName(key)] = entry[key])
				)(entry);
				return row;
			}, entries);

			return {
				data,
				index: sheet.index,
				link: sheet.link,
				title: sheet.title
			};
		});
	});
};
