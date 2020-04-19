export class SpotifyPlaylistUpdater {
	static update(): Promise<void> {
		if (SpotifyPlaylistUpdater.singleton) {
			return Promise.reject("Updater is already running");
		}

		SpotifyPlaylistUpdater.singleton = new SpotifyPlaylistUpdater();
		return SpotifyPlaylistUpdater.singleton.run();
	}
	private static singleton: SpotifyPlaylistUpdater;

	private run(): Promise<void> {
		return Promise.reject("TBD");
	}
}