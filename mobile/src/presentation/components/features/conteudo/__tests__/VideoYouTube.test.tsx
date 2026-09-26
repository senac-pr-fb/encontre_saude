import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { VideoYouTube } from '../VideoYouTube';

describe('VideoYouTube', () => {
  it('renderiza o rótulo e o botão acessível de reprodução', async () => {
    await render(<VideoYouTube id="abc123" />);

    expect(screen.getByText('Assistir no YouTube')).toBeTruthy();
    expect(screen.getByLabelText('Assistir ao vídeo demonstrativo no YouTube')).toBeTruthy();
  });

  it('abre o YouTube com a URL do vídeo ao pressionar', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await render(<VideoYouTube id="abc123" />);
    await fireEvent.press(screen.getByLabelText('Assistir ao vídeo demonstrativo no YouTube'));

    expect(openURL).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc123');
    openURL.mockRestore();
  });
});
