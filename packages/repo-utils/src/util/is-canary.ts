const isCanary = (test: string) => /^\d+\.\d+\.\d+-canary\.\d+$/.test(test);

export default isCanary;
