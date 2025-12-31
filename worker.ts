import { PlatformContext } from 'jfrog-workers';
import { ActionStatus, BeforeDownloadRequestRequest, BeforeDownloadRequestResponse } from './types';


export default async (context: PlatformContext, data: BeforeDownloadRequestRequest): Promise<BeforeDownloadRequestResponse> => {

    let status: ActionStatus = ActionStatus.PROCEED;
    let message: string = '';

    try {
        // Check if user is anonymous
        const userContext = data.userContext;
        
        // Log user context for debugging
        console.log('User context:', JSON.stringify(userContext));
        console.log('User ID:', userContext?.id);
        console.log('User realm:', userContext?.realm);
        
        // User is anonymous if:
        // 1. userContext is null/undefined/empty
        // 2. userContext.id is 'anonymous' or starts with 'anonymous@'
        // 3. userContext.realm is 'anonymous'
        // 4. userContext.id is empty or undefined
        const isAnonymous = !userContext || 
            !userContext.id ||
            userContext.id === 'anonymous' || 
            userContext.id.startsWith('anonymous@') ||
            userContext.realm === 'anonymous' ||
            userContext.id === '';
        
        // Block anonymous users only (remove test user blocking for production)
        if (isAnonymous && data.metadata) {
            // Check both repoPath and originalRepoPath (for virtual repos)
            const repoKeysToCheck: string[] = [];
            
            if (data.metadata.repoPath?.key) {
                repoKeysToCheck.push(data.metadata.repoPath.key);
            }
            
            if (data.metadata.originalRepoPath?.key) {
                repoKeysToCheck.push(data.metadata.originalRepoPath.key);
            }
            
            // Check if any repository name contains "local" (except "c1")
            // This applies to ALL repository types: local, remote, virtual, federated
            for (const repoKey of repoKeysToCheck) {
                const containsLocal = repoKey.toLowerCase().includes('local');
                const isNotC1 = repoKey.toLowerCase() !== 'c1';
                
                if (containsLocal && isNotC1) {
                    // Block anonymous users access to repositories containing "local" (except c1)
                    status = ActionStatus.STOP;
                    message = `Anonymous users are not allowed to download from repository: ${repoKey}`;
                    console.log(`Blocked anonymous user download from repository: ${repoKey} (type: any)`);
                    
                    return {
                        status,
                        message,
                        modifiedRepoPath: data.metadata.repoPath
                    };
                }
            }
        }

        // Allow the download to proceed
        status = ActionStatus.PROCEED;
        message = 'Download request allowed';
        
        if (isAnonymous) {
            console.log(`Anonymous user download allowed for repository: ${data.metadata?.repoPath?.key || 'unknown'}`);
        }

    } catch(error: any) {
        // If there's an error, stop the request
        status = ActionStatus.STOP;
        message = `Error processing download request: ${error.message || 'Unknown error'}`;
        console.error(`Worker error: ${message}`);
    }

    return {
        status,
        message,
        modifiedRepoPath: data.metadata?.repoPath
    }
}
