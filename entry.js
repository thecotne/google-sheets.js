import {getGoogleSheet} from "./src/google-sheets";

getGoogleSheet('15o-c4FRFFpt0hZylxWY06vvptftMDubW1XORIN2J05U')
.then((sheets) => {
	sheets.forEach((data) => {
		console.log(data);
	});
});
