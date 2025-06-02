export async function convertApTemplate(template: any) {
    try {
        let templateString = JSON.stringify(template);
        templateString = templateString.replaceAll('pieceName', 'blockName').replaceAll('pieceType', 'blockType');
        return JSON.parse(templateString);
    } catch (error) {
        console.error(error);
        return template;
    }
}
