
import './App.css';
import 'antd/dist/reset.css';
import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
} from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import Home from './Home';

const { chains, provider } = configureChains(
  [chain.polygon, chain.polygonMumbai],
  [
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_ID }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'CryptoMomo AirDrop',
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

function App() {

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Home />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
