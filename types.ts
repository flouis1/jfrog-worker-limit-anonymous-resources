
export interface BeforeDownloadRequestRequest {
    /** Various immutable download metadata */
    metadata:
            | DownloadMetadata
            | undefined;
    /** The immutable request headers */
    headers: { [key: string]: Header };
    /** The user context which sends the request */
    userContext:
            | UserContext
            | undefined;
}

export interface DownloadMetadata {
    /** The repoPath object of the request */
    repoPath:
            | RepoPath
            | undefined;
    /** The original repo path in case a virtual repo is involved */
    originalRepoPath:
            | RepoPath
            | undefined;
    /** The file name from path */
    name: string;
    /** Is it a head request */
    headOnly: boolean;
    /** Is it a checksum request */
    checksum: boolean;
    /** Is it a recursive request */
    recursive: boolean;
    /** When a modification has occurred */
    modificationTime: number;
    /** Is it a directory request */
    directoryRequest: boolean;
    /** Is it a metadata request */
    metadata: boolean;
    /** Last modification time that occurred */
    lastModified: number;
    /** If a modification happened since the last modification time */
    ifModifiedSince: number;
    /** The url that points to artifactory */
    servletContextUrl: string;
    /** The request URI */
    uri: string;
    /** The client address */
    clientAddress: string;
    /** The resource path of the requested zip */
    zipResourcePath: string;
    /** Is the request a zip resource request */
    zipResourceRequest: boolean;
    /** should replace the head request with get */
    replaceHeadRequestWithGet: boolean;
    /** Repository type */
    repoType: RepoType;
}

export interface RepoPath {
    /** The repo key */
    key: string;
    /** The path itself */
    path: string;
    /** The key:path combination */
    id: string;
    /** Is the path the root */
    isRoot: boolean;
    /** Is the path a folder */
    isFolder: boolean;
}

export interface Header {
    value: string[];
}

export interface UserContext {
    /** The username or subject */
    id: string;
    /** Is the context an accessToken */
    isToken: boolean;
    /** The realm of the user */
    realm: string;
}

export enum RepoType {
    REPO_TYPE_UNSPECIFIED = 0,
    REPO_TYPE_LOCAL = 1,
    REPO_TYPE_REMOTE = 2,
    REPO_TYPE_FEDERATED = 3,
    UNRECOGNIZED = -1,
}

export interface BeforeDownloadRequestResponse {
    /** The instruction of how to proceed */
    status: ActionStatus;
    /** Message to print to the log, in case of an error it will be printed as a warning */
    message: string;
    /** Indicates whether worker execution succeeded or failed */
    executionStatus?: Status;
    /** The immutable request headers */
    headers?: { [key: string]: Header };
    /** The modified repo path from the worker */
    modifiedRepoPath?:
            | RepoPath
            | undefined;
    expired?: boolean

}

export interface Header {
    value: string[];
}

export enum ActionStatus {
    UNSPECIFIED = 0,
    PROCEED = 1,
    STOP = 2,
    WARN = 3,
    UNRECOGNIZED = -1,
}
