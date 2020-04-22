import gulp from 'gulp';
import ts, { Project as TypeScriptProject } from 'gulp-typescript';
import tslint from 'gulp-tslint';
import { spawn, ChildProcess } from 'child_process';
import del from 'del';
import sourcemaps from 'gulp-sourcemaps';

const OUTPUT_DIRECTORY: string = 'dist';
const tsProject: TypeScriptProject = ts.createProject('tsconfig.json', {
	outDir: OUTPUT_DIRECTORY
});

// Launch the server. If the server is already running, kill it and restart it
let serverNode: ChildProcess|undefined;
async function restartServer(): Promise<void> {
	if (serverNode !== undefined) {
		serverNode.kill();
	}

	serverNode = await spawn('node', ['--inspect=9230', `${OUTPUT_DIRECTORY}/server.js`], { stdio: 'inherit' });
}

// Launch the worker. If the worker is already running kill it and restart it
let workerNode: ChildProcess|undefined;
async function restartWorker(): Promise<void> {
	if (workerNode !== undefined) {
		workerNode.kill();
	}

	workerNode = await spawn('node', ['--inspect=9231', `${OUTPUT_DIRECTORY}/worker.js`], { stdio: 'inherit' });
}

function build(): Promise<any> {
	return Promise.all([
		buildSourceTypeScript(),
		copyStaticFiles()
	]);
}

function copyStaticFiles(): NodeJS.ReadWriteStream {
	return gulp.src(['src/**/*.html', 'src/**/*.css'])
		.pipe(gulp.dest(`${OUTPUT_DIRECTORY}`));
}

function getSourceFiles(): NodeJS.ReadWriteStream {
	return gulp.src("src/**/*.{ts,tsx}");
}
function buildSourceTypeScript(): NodeJS.ReadWriteStream {
	return getSourceFiles()
		.pipe(sourcemaps.init()) // Necessary for sourcemap generation
		.pipe(tsProject())
		.pipe(sourcemaps.write('.', { sourceRoot: './' }))
		.pipe(gulp.dest(OUTPUT_DIRECTORY));
}
function restartAllProcesses(): Promise<any> {
	return Promise.all([
		restartServer(),
		restartWorker()
	]);
}

gulp.task('build', build);
gulp.task('clean', () => {
	return del(`${OUTPUT_DIRECTORY}/**`);
});
gulp.task('watch', () => {
	gulp.watch('src/**', {
		ignoreInitial: false
	}, build);
	gulp.watch(`${OUTPUT_DIRECTORY}/**`, {
		queue: false,
		ignoreInitial: false
	}, restartAllProcesses);
});

gulp.task('lint', () => {
	return getSourceFiles()
		.pipe(tslint())
		.pipe(tslint.report());
});