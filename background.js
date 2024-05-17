chrome.runtime.onInstalled.addListener(function () {
	chrome.storage.local.set({ fetchOnInstall: true }, function () {
		console.log(
			"Extension installed - Ready to fetch ignored users on next run",
		);
	});
});

chrome.webNavigation.onCompleted.addListener(
	function (details) {
		if (
			details.url.includes(
				"https://forocoches.com/foro/profile.php?do=doaddlist",
			) ||
			details.url.includes(
				"https://forocoches.com/foro/profile.php?do=doremovelist",
			)
		) {
			chrome.tabs.sendMessage(details.tabId, { action: "fetchIgnoredUsers" });
		}
	},
	{
		url: [
			{ urlMatches: "https://forocoches.com/foro/profile.php?do=doaddlist.*" },
			{
				urlMatches: "https://forocoches.com/foro/profile.php?do=doremovelist.*",
			},
		],
	},
);
