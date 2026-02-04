#!/bin/bash
set -e

echo "=========================================="
echo "  Rainbow Veil / Phantom Streams Setup"
echo "=========================================="

# Install Solana CLI
echo "[1/5] Installing Solana CLI..."
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
solana --version

# Generate keypair if not exists
if [ ! -f ~/.config/solana/id.json ]; then
  echo "[1.5/5] Generating Solana keypair..."
  solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json
fi
solana config set --url localhost

# Install Anchor CLI
echo "[2/5] Installing Anchor CLI..."
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
anchor --version

# Install Noir (noirup)
echo "[3/5] Installing Noir..."
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
export PATH="$HOME/.nargo/bin:$PATH"
echo 'export PATH="$HOME/.nargo/bin:$PATH"' >> ~/.bashrc
~/.nargo/bin/noirup
~/.nargo/bin/nargo --version

# Install Barretenberg
echo "[4/5] Installing Barretenberg..."
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/cpp/installation/install | bash
export PATH="$HOME/.bb:$PATH"
echo 'export PATH="$HOME/.bb:$PATH"' >> ~/.bashrc
~/.bb/bbup -v 0.74.0

# Node dependencies and build
echo "[5/5] Installing Node dependencies and building..."
npm install
anchor build

# Compile Noir circuits
echo "[Bonus] Compiling Noir circuits..."
cd circuits && ~/.nargo/bin/nargo compile && cd ..

echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "To run tests:     anchor test"
echo "To run demo:      node unicorny_real_demo.js"
echo "To start validator: solana-test-validator"
echo ""
