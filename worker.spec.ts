import { PlatformContext, PlatformClients, PlatformHttpClient } from 'jfrog-workers';
import { BeforeDownloadRequestRequest, ActionStatus } from './types';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import runWorker from './worker';

describe("limit-anonymous-resources tests", () => {
    let context: DeepMocked<PlatformContext>;
    let request: DeepMocked<BeforeDownloadRequestRequest>;

    beforeEach(() => {
        context = createMock<PlatformContext>({
            clients: createMock<PlatformClients>({
                platformHttp: createMock<PlatformHttpClient>({
                    get: jest.fn().mockResolvedValue({ status: 200 })
                })
            })
        });
        request = createMock<BeforeDownloadRequestRequest>();
    })

    it('should allow non-anonymous users', async () => {
        request.userContext = {
            id: 'authenticated-user',
            isToken: false,
            realm: 'internal'
        };
        request.metadata = {
            repoPath: {
                key: 'my-local-repo',
                path: '/test/artifact',
                id: 'my-local-repo:/test/artifact',
                isRoot: false,
                isFolder: false
            }
        } as any;

        const result = await runWorker(context, request);
        expect(result.status).toBe(ActionStatus.PROCEED);
    })

    it('should block anonymous users from repositories containing "local" (except c1)', async () => {
        request.userContext = {
            id: 'anonymous',
            isToken: false,
            realm: 'anonymous'
        };
        request.metadata = {
            repoPath: {
                key: 'my-local-repo',
                path: '/test/artifact',
                id: 'my-local-repo:/test/artifact',
                isRoot: false,
                isFolder: false
            }
        } as any;

        const result = await runWorker(context, request);
        expect(result.status).toBe(ActionStatus.STOP);
        expect(result.message).toContain('Anonymous users are not allowed');
    })

    it('should allow anonymous users to access c1 repository', async () => {
        request.userContext = {
            id: 'anonymous',
            isToken: false,
            realm: 'anonymous'
        };
        request.metadata = {
            repoPath: {
                key: 'c1',
                path: '/test/artifact',
                id: 'c1:/test/artifact',
                isRoot: false,
                isFolder: false
            }
        } as any;

        const result = await runWorker(context, request);
        expect(result.status).toBe(ActionStatus.PROCEED);
    })

    it('should allow anonymous users to access repositories without "local" in name', async () => {
        request.userContext = {
            id: 'anonymous',
            isToken: false,
            realm: 'anonymous'
        };
        request.metadata = {
            repoPath: {
                key: 'remote-repo',
                path: '/test/artifact',
                id: 'remote-repo:/test/artifact',
                isRoot: false,
                isFolder: false
            }
        } as any;

        const result = await runWorker(context, request);
        expect(result.status).toBe(ActionStatus.PROCEED);
    })

    it('should block anonymous users from remote repositories containing "local"', async () => {
        request.userContext = {
            id: 'anonymous',
            isToken: false,
            realm: 'anonymous'
        };
        request.metadata = {
            repoPath: {
                key: 'remote-local-repo',
                path: '/test/artifact',
                id: 'remote-local-repo:/test/artifact',
                isRoot: false,
                isFolder: false
            }
        } as any;

        const result = await runWorker(context, request);
        expect(result.status).toBe(ActionStatus.STOP);
        expect(result.message).toContain('Anonymous users are not allowed');
    })

    it('should block anonymous users from virtual repos when originalRepoPath contains "local"', async () => {
        request.userContext = {
            id: 'anonymous',
            isToken: false,
            realm: 'anonymous'
        };
        request.metadata = {
            repoPath: {
                key: 'virtual-repo',
                path: '/test/artifact',
                id: 'virtual-repo:/test/artifact',
                isRoot: false,
                isFolder: false
            },
            originalRepoPath: {
                key: 'my-local-repo',
                path: '/test/artifact',
                id: 'my-local-repo:/test/artifact',
                isRoot: false,
                isFolder: false
            }
        } as any;

        const result = await runWorker(context, request);
        expect(result.status).toBe(ActionStatus.STOP);
        expect(result.message).toContain('Anonymous users are not allowed');
        expect(result.message).toContain('my-local-repo');
    })
});