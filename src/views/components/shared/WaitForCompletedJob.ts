import { JobType } from "../../../types/JobType";
import { JobStatus } from "bull";
const wait = (time: number): Promise<void> => { return new Promise<void>((resolve) => { setTimeout(resolve, time); }); };

export async function WaitForCompletedJob(jobType: JobType, id: number, password: string): Promise<any> {
	// eslint-disable-next-line no-constant-condition
	while(true) {
		await wait(2000);
		const response: Response = await fetch(`/job/${jobType}/${id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				password
			})
		});
		const responseBody: any = await response.json();
		const status: JobStatus = responseBody.status;
		if (status === "completed") {
			return Promise.resolve(responseBody);
		} else if (status === "failed") {
			return Promise.reject(responseBody);
		}
	}
}