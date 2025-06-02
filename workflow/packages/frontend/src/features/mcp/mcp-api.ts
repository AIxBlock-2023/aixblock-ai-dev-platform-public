import { api } from '@/lib/api';
import {
  McpBlockStatus,
  McpBlockWithConnection,
  McpWithBlocks,
  SeekPage
} from 'workflow-shared';

interface UpdateMCPParams {
  id: string;
  token?: string;
}

interface AddPieceParams {
  mcpId: string;
  blockName: string;
  connectionId?: string;
  status: McpBlockStatus;
}

interface UpdatePieceParams {
  pieceId: string;
  connectionId?: string;
  status?: McpBlockStatus;
}

export const mcpApi = {
  async get() {
    return await api
      .get<SeekPage<McpWithBlocks>>(`/v1/mcp-servers`)
      .then((res) => res.data[0]);
  },
  async update({ id, token }: UpdateMCPParams) {
    return await api.post<McpWithBlocks>(`/v1/mcp-servers/${id}`, {
      token,
    });
  },
  async rotateToken(id: string) {
    return await api.post<McpWithBlocks>(`/v1/mcp-servers/${id}/rotate`);
  },
  async getPieces() {
    return await api.get<{ pieces: McpBlockWithConnection[] }>(
      `/v1/mcp-blocks`,
    );
  },
  async addPiece({
    mcpId,
    blockName,
    connectionId,
    status,
  }: AddPieceParams): Promise<McpWithBlocks> {
    return await api.post(`/v1/mcp-blocks`, {
      mcpId,
      blockName,
      connectionId,
      status,
    });
  },
  async updatePiece({
    pieceId,
    connectionId,
    status,
  }: UpdatePieceParams): Promise<McpWithBlocks> {
    return await api.post(`/v1/mcp-blocks/${pieceId}`, {
      connectionId,
      status,
    });
  },
  async deletePiece(pieceId: string): Promise<McpWithBlocks> {
    return await api.delete(`/v1/mcp-blocks/${pieceId}`);
  },
};
