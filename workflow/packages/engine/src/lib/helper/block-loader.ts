import { Action, Piece, PiecePropertyMap, Trigger } from 'workflow-blocks-framework'
import { AIxBlockError, ErrorCode, ExecutePropsOptions, extractBlockFromModule, getPackageAliasForBlock, isNil } from 'workflow-shared'

// Define the whitelisted directory for FILE source blocks
const ALLOWED_BLOCKS_DIR = 'blocks'

const loadBlockOrThrow = async (
    { blockName, pieceVersion, piecesSource }:
    { blockName: string, pieceVersion: string, piecesSource: string },
): Promise<Piece> => {
    const packageName = getPackageAlias({
        blockName,
        pieceVersion,
        piecesSource,
    })

    const module = await import(packageName)
    const piece = extractBlockFromModule<Piece>({
        module,
        blockName,
        pieceVersion,
    })

    if (isNil(piece)) {
        throw new AIxBlockError({
            code: ErrorCode.BLOCK_NOT_FOUND,
            params: {
                blockName,
                pieceVersion,
                message: 'Piece not found in the engine',
            },
        })
    }

    return piece
}

const getBlockAndTriggerOrThrow = async (params: {
    blockName: string
    pieceVersion: string
    triggerName: string
    piecesSource: string
},
): Promise<{ piece: Piece, pieceTrigger: Trigger }> => {
    const { blockName, pieceVersion, triggerName, piecesSource } = params
    const piece = await loadBlockOrThrow({ blockName, pieceVersion, piecesSource })
    const trigger = piece.getTrigger(triggerName)

    if (trigger === undefined) {
        throw new Error(`trigger not found, blockName=${blockName}, triggerName=${triggerName}`)
    }

    return {
        piece,
        pieceTrigger: trigger,
    }
}

const getBlockAndActionOrThrow = async (params: {
    blockName: string
    pieceVersion: string
    actionName: string
    piecesSource: string
},
): Promise<{ piece: Piece, pieceAction: Action }> => {
    const { blockName, pieceVersion, actionName, piecesSource } = params

    const piece = await loadBlockOrThrow({ blockName, pieceVersion, piecesSource })
    const pieceAction = piece.getAction(actionName)

    if (isNil(pieceAction)) {
        throw new AIxBlockError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                blockName,
                pieceVersion,
                stepName: actionName,
            },
        })
    }

    return {
        piece,
        pieceAction,
    }
}

const getPropOrThrow = async ({ params, piecesSource }: { params: ExecutePropsOptions, piecesSource: string }) => {
    const { piece: piecePackage, actionOrTriggerName, propertyName } = params

    const piece = await loadBlockOrThrow({ blockName: piecePackage.blockName, pieceVersion: piecePackage.pieceVersion, piecesSource })

    const actionOrTrigger = piece.getAction(actionOrTriggerName) ?? piece.getTrigger(actionOrTriggerName)

    if (isNil(actionOrTrigger)) {
        throw new AIxBlockError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                blockName: piecePackage.blockName,
                pieceVersion: piecePackage.pieceVersion,
                stepName: actionOrTriggerName,
            },
        })
    }

    const prop = (actionOrTrigger.props  as PiecePropertyMap)[propertyName]

    if (isNil(prop)) {
        throw new AIxBlockError({
            code: ErrorCode.CONFIG_NOT_FOUND,
            params: {
                blockName: piecePackage.blockName,
                pieceVersion: piecePackage.pieceVersion,
                stepName: actionOrTriggerName,
                configName: propertyName,
            },
        })
    }

    return prop
}

const getPackageAlias = ({ blockName, pieceVersion, piecesSource }: {
    blockName: string
    piecesSource: string
    pieceVersion: string
}) => {
    if (piecesSource.trim() === 'FILE') {
        // Validate blockName to prevent directory traversal
        if (blockName.includes('..') || blockName.startsWith('/')) {
            throw new AIxBlockError({
                code: ErrorCode.BLOCK_NOT_FOUND,
                params: {
                    blockName,
                    pieceVersion,
                    message: 'Invalid block path: Path traversal not allowed',
                },
            })
        }

        // Ensure the block is in the whitelisted directory
        const normalizedPath = blockName.replace(/\\/g, '/')
        if (normalizedPath.includes('/')) {
            throw new AIxBlockError({
                code: ErrorCode.BLOCK_NOT_FOUND,
                params: {
                    blockName,
                    pieceVersion,
                    message: 'Invalid block path: Block must be in the allowed blocks directory',
                },
            })
        }

        return `./${ALLOWED_BLOCKS_DIR}/${normalizedPath}`
    }

    return getPackageAliasForBlock({
        blockName,
        pieceVersion,
    })
}


export const blockLoader = {
    loadBlockOrThrow,
    getBlockAndTriggerOrThrow,
    getBlockAndActionOrThrow,
    getPropOrThrow,
}
