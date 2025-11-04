const { ethers } = require('ethers');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https'); // Diperlukan untuk GitHubPasswordSync

// ===== MODERN UI SYSTEM =====
class ModernUI {
    constructor() {
        this.theme = {
            primary: '\x1b[38;5;51m',
            secondary: '\x1b[38;5;141m',
            success: '\x1b[38;5;46m',
            warning: '\x1b[38;5;214m',
            error: '\x1b[38;5;203m',
            info: '\x1b[38;5;249m',
            accent: '\x1b[38;5;213m',
            reset: '\x1b[0m'
        };
        this.currentLoadingText = '';
        this.loadingInterval = null;
        this.box = {
            tl: '╭', tr: '╮', bl: '╰', br: '╯',
            h: '─', v: '│', 
            lt: '├', rt: '┤', tt: '┬', bt: '┴'
        };
    }

    showBanner() {
        console.clear();
        console.log(`${this.theme.accent}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ███████╗ █████╗     ███████╗████████╗ █████╗ ██████╗ ██╗  ██╗███████╗      ║
║  ██╔════╝██╔══██╗    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚██╗██╔╝██╔════╝      ║
║  █████╗  ███████║    ███████╗   ██║   ███████║██████╔╝ ╚███╔╝ ███████╗      ║
║  ██╔══╝  ██╔══██║    ╚════██║   ██║   ██╔══██║██╔══██╗ ██╔██╗ ╚════██║      ║
║  ██║     ██║  ██║    ███████║   ██║   ██║  ██║██║  ██║██╔╝ ██╗███████║      ║
║  ╚═╝     ╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝      ║
║                                                                              ║
║                   🚀 MULTI-CHAIN TRANSFER BOT v9.2 🚀                       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🔔 Telegram Enabled  •  🎯 Auto Token Detection  •  👥 Multi-Account       ║
╚══════════════════════════════════════════════════════════════════════════════╝${this.theme.reset}\n`);
    }

    createBox(title, content, type = 'info') {
        const colors = {
            info: this.theme.primary,
            success: this.theme.success,
            warning: this.theme.warning,
            error: this.theme.error
        };
        const color = colors[type] || this.theme.primary;
        
        console.log(`${color}${this.box.tl}${this.box.h.repeat(68)}${this.box.tr}${this.theme.reset}`);
        console.log(`${color}${this.box.v}${this.theme.reset} ${this.theme.accent}${title.padEnd(66)}${this.theme.reset} ${color}${this.box.v}${this.theme.reset}`);
        console.log(`${color}${this.box.lt}${this.box.h.repeat(68)}${this.box.rt}${this.theme.reset}`);
        
        if (Array.isArray(content)) {
            content.forEach(line => {
                console.log(`${color}${this.box.v}${this.theme.reset} ${line.padEnd(66)} ${color}${this.box.v}${this.theme.reset}`);
            });
        } else {
            const lines = content.split('\n');
            lines.forEach(line => {
                console.log(`${color}${this.box.v}${this.theme.reset} ${line.padEnd(66)} ${color}${this.box.v}${this.theme.reset}`);
            });
        }
        
        console.log(`${color}${this.box.bl}${this.box.h.repeat(68)}${this.box.br}${this.theme.reset}\n`);
    }

    showNotification(type, message, title = null) {
        const icons = { 
            success: '✅', 
            error: '❌', 
            warning: '⚠️', 
            info: 'ℹ️',
            telegram: '📡',
            scan: '🔍'
        };
        const titles = {
            success: 'SUCCESS',
            error: 'ERROR',
            warning: 'WARNING', 
            info: 'INFO',
            telegram: 'TELEGRAM',
            scan: 'SCAN'
        };
        
        this.stopLoading();
        const notifTitle = title || titles[type];
        const icon = icons[type] || '📢';
        
        this.createBox(`${icon} ${notifTitle}`, [message], type);
    }

    startLoading(text) {
        this.currentLoadingText = text;
        const frames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
        let i = 0;
        
        this.loadingInterval = setInterval(() => {
            process.stdout.write(`\r${this.theme.secondary}${frames[i]}${this.theme.reset} ${text}`);
            i = (i + 1) % frames.length;
        }, 120);
    }

    stopLoading() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
            process.stdout.write('\r\x1b[K');
        }
    }

    showTransactionSummary(tokenInfo, amount, gasCost, txHash = null, network = null) {
        this.stopLoading();
        
        const content = [
            `🪙 Token: ${tokenInfo.name} (${tokenInfo.symbol})`,
            `💰 Amount: ${this.theme.success}${amount} ${tokenInfo.symbol}${this.theme.reset}`,
            `⛽ Gas: ${gasCost.gasCostFormatted} ETH (${gasCost.gasCostIDR.toLocaleString('id-ID')} IDR)`,
            network ? `🌐 Network: ${network}` : ''
        ].filter(line => line.trim());
        
        if (txHash) {
            content.push(`📄 TX: ${this.maskAddress(txHash)}`);
        }
        
        this.createBox('🎯 TRANSACTION EXECUTED', content, 'success');
    }

    createMenu(title, options, description = null) {
        this.stopLoading();
        
        const menuContent = [];
        if (description) {
            menuContent.push(description, '');
        }
        
        options.forEach((opt, idx) => {
            const number = `${idx + 1}`.padEnd(2);
            menuContent.push(`${this.theme.accent}${number}${this.theme.reset} ${opt}`);
        });
        
        this.createBox(`📋 ${title}`, menuContent, 'info');
    }

    showAccountSummary(config, mode) {
        const modeText = {
            '1': '🪙 ETH Auto-Forward',
            '2': '🪙 Token Auto-Forward', 
            '3': '🪙 Token Transfer Once',
            '4': '🎯 Auto Token Detection'
        }[mode];
        
        const content = [
            `🎯 Mode: ${modeText}`,
            `🌐 Network: ${config.network}`,
            `📤 From: ${this.maskAddress(config.fromAddress)}`,
            `📥 To: ${this.maskAddress(config.destinationAddress)}`,
            config.tokenAddress ? `🪙 Token: ${this.maskAddress(config.tokenAddress)}` : '🪙 Token: Auto-Detect',
            `💰 Min Balance: ${GAS_CONFIG.MIN_ETH_BALANCE} ETH`,
            `🏷️  Account Name: ${config.accountName || 'Unnamed'}`
        ];
        
        this.createBox('👤 ACCOUNT CONFIGURATION', content, 'info');
    }

    maskAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 8)}...${address.slice(-6)}`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showProgressBar(percentage, label = 'Processing') {
        const bars = 20;
        const filled = Math.round((percentage / 100) * bars);
        const empty = bars - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        
        process.stdout.write(`\r${this.theme.primary}${label}: [${bar}] ${percentage}%${this.theme.reset}`);
    }

    showTokenScanProgress(current, total, network) {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        this.showProgressBar(percentage, `Scanning ${network} tokens`);
    }

    showTokenScanResults(tokens) {
        if (tokens.length === 0) {
            this.createBox('🔍 TOKEN SCAN RESULTS', ['No tokens found with balance'], 'warning');
            return;
        }

        const content = [
            `📊 Found ${tokens.length} token(s) with balance:`,
            ''
        ];

        tokens.forEach((token, index) => {
            content.push(`${this.theme.success}${index + 1}. ${token.symbol} - ${token.name}${this.theme.reset}`);
            content.push(`   Balance: ${this.theme.accent}${token.balance} ${token.symbol}${this.theme.reset}`);
            content.push(`   Contract: ${this.maskAddress(token.address)}`);
            content.push('');
        });

        this.createBox('🎯 TOKENS DETECTED', content, 'success');
    }
}

// ===== INPUT HANDLER =====
class InputHandler {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.ui = new ModernUI();
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(`\n${this.ui.theme.secondary}${prompt}${this.ui.theme.reset} `, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    close() {
        if (this.rl) {
            this.rl.close();
        }
    }
}

// Initialize UI and Input
const ui = new ModernUI();
const input = new InputHandler();

// ===== GAS CONFIGURATION =====
const GAS_CONFIG = {
    GAS_LIMIT: 100000,
    MIN_ETH_BALANCE: "0.0001",
    CHECK_INTERVAL_MS: 10000,
    GAS_ESTIMATE_BUFFER: 1.2,
    TOKEN_SCAN_INTERVAL: 30000
};

// ===== ADVANCED TOKEN DETECTOR =====
class AdvancedTokenDetector {
    constructor(provider, walletAddress) {
        this.provider = provider;
        this.walletAddress = walletAddress;
        this.detectedTokens = new Map();
    }

    // Enhanced token database with more tokens
    getTokenDatabase(network) {
        const database = {
            'BASE': [
                { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin' },
                { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ethereum' },
                { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', symbol: 'USDbC', name: 'USD Base Coin' },
                { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin' },
                { address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b', symbol: 'tBTC', name: 'Threshold Bitcoin' }
            ],
            'ARBITRUM': [
                { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', name: 'USD Coin' },
                { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD' },
                { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ethereum' },
                { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin' },
                { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', name: 'Wrapped BTC' }
            ],
            'OPTIMISM': [
                { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', name: 'USD Coin' },
                { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD' },
                { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ethereum' },
                { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin' },
                { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', symbol: 'WBTC', name: 'Wrapped BTC' }
            ],
            'POLYGON': [
                { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin' },
                { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD' },
                { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ethereum' },
                { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai Stablecoin' },
                { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped BTC' }
            ],
            'ETHEREUM': [
                { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin' },
                { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD' },
                { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ethereum' },
                { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin' },
                { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped BTC' }
            ]
        };
        return database[network] || [];
    }

    async scanForTokens(network) {
        try {
            ui.startLoading(`🔍 Scanning blockchain for tokens on ${network}...`);
            
            const tokens = [];
            const networkTokens = this.getTokenDatabase(network);
            const totalTokens = networkTokens.length;
            
            for (let i = 0; i < networkTokens.length; i++) {
                const token = networkTokens[i];
                
                // Show progress
                ui.showTokenScanProgress(i + 1, totalTokens, network);
                
                try {
                    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider);
                    
                    // Check if contract is valid by trying to get symbol
                    const symbol = await tokenContract.symbol();
                    const balance = await tokenContract.balanceOf(this.walletAddress);
                    const decimals = await tokenContract.decimals();
                    const name = await tokenContract.name();
                    
                    const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
                    
                    if (balanceFormatted > 0) {
                        const tokenInfo = {
                            address: token.address,
                            symbol: symbol,
                            name: name,
                            balance: balanceFormatted,
                            decimals: decimals,
                            contract: tokenContract
                        };
                        tokens.push(tokenInfo);
                        this.detectedTokens.set(token.address, tokenInfo);
                        
                        ui.showNotification('scan', `Found: ${balanceFormatted} ${symbol}`);
                    }
                } catch (error) {
                    // Skip invalid tokens
                    continue;
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            ui.stopLoading();
            return tokens;
        } catch (error) {
            ui.stopLoading();
            ui.showNotification('error', `Token scan failed: ${error.message}`);
            return [];
        }
    }

    async comprehensiveScan(network) {
        ui.startLoading(`🚀 Starting comprehensive token scan on ${network}...`);
        
        // Method 1: Database tokens
        const databaseTokens = await this.scanForTokens(network);
        
        ui.showNotification('success', `Scan completed: Found ${databaseTokens.length} tokens with balance`);
        
        return databaseTokens;
    }

    startContinuousScan(network, callback, interval = 30000) {
        ui.showNotification('info', `🔄 Starting continuous token monitoring every ${interval/1000} seconds`);
        
        let previousTokens = new Set();
        
        const scanInterval = setInterval(async () => {
            try {
                ui.startLoading(`🔄 Rescanning for new tokens on ${network}...`);
                const currentTokens = await this.scanForTokens(network);
                const currentTokenAddresses = new Set(currentTokens.map(t => t.address));
                
                // Check for new tokens
                for (const token of currentTokens) {
                    if (!previousTokens.has(token.address) && token.balance > 0) {
                        ui.showNotification('success', `🎯 New token detected: ${token.symbol} - ${token.balance} ${token.symbol}`);
                        if (callback) {
                            callback(token);
                        }
                    }
                }
                
                previousTokens = currentTokenAddresses;
                ui.stopLoading();
            } catch (error) {
                ui.stopLoading();
                ui.showNotification('error', `Monitoring error: ${error.message}`);
            }
        }, interval);

        return scanInterval;
    }
}

// ===== SIMPLE GAS OPTIMIZER =====
class SimpleGasOptimizer {
    constructor(provider, chainId) {
        this.provider = provider;
        this.chainId = chainId;
        this.nonceCache = new Map();
    }

    async getOptimalGasPrice() {
        try {
            const feeData = await this.provider.getFeeData();
            // Use maxFeePerGas for EIP-1559 chains
            return feeData.maxFeePerGas || feeData.gasPrice || ethers.parseUnits("15", "gwei");
        } catch (error) {
            return ethers.parseUnits("15", "gwei");
        }
    }

    async calculateTransactionCost(gasLimit) {
        try {
            const gasPrice = await this.getOptimalGasPrice();
            const gasCostWei = gasPrice * BigInt(gasLimit);
            const gasCostETH = parseFloat(ethers.formatEther(gasCostWei));
            const gasCostIDR = Math.round(gasCostETH * 16000000);
            
            return {
                gasPrice,
                gasCostWei,
                gasCostETH,
                gasCostIDR,
                gasCostFormatted: gasCostETH.toFixed(8)
            };
        } catch (error) {
            // Fallback calculation
            const gasPrice = ethers.parseUnits("15", "gwei");
            const gasCostWei = gasPrice * BigInt(gasLimit);
            const gasCostETH = parseFloat(ethers.formatEther(gasCostWei));
            
            return {
                gasPrice,
                gasCostWei,
                gasCostETH,
                gasCostIDR: Math.round(gasCostETH * 16000000),
                gasCostFormatted: gasCostETH.toFixed(8)
            };
        }
    }

    async getCurrentNonce(walletAddress) {
        try {
            const key = `${walletAddress}-${this.chainId}`;
            
            if (this.nonceCache.has(key)) {
                const cached = this.nonceCache.get(key);
                if (Date.now() - cached.timestamp < 30000) {
                    return cached.nonce;
                }
            }
            
            const nonce = await this.provider.getTransactionCount(walletAddress, 'pending');
            this.nonceCache.set(key, { nonce, timestamp: Date.now() });
            return nonce;
        } catch (error) {
            const key = `${walletAddress}-${this.chainId}`;
            return this.nonceCache.has(key) ? this.nonceCache.get(key).nonce : 0;
        }
    }

    updateNonce(walletAddress) {
        const key = `${walletAddress}-${this.chainId}`;
        if (this.nonceCache.has(key)) {
            const current = this.nonceCache.get(key);
            this.nonceCache.set(key, {
                nonce: current.nonce + 1,
                timestamp: Date.now()
            });
        }
    }

    clearNonceCache(walletAddress) {
        const key = `${walletAddress}-${this.chainId}`;
        this.nonceCache.delete(key);
    }
}

// ===== ENHANCED SECURE CONFIG MANAGER =====
class EnhancedSecureConfigManager {
    constructor() {
        this.configFile = path.join(__dirname, 'multi-account-bot-config.enc');
    }

    saveMultipleAccounts(accounts, password) {
        try {
            const accountsData = { 
                version: "2.1", 
                accounts: accounts,
                lastUpdated: new Date().toISOString(),
                totalAccounts: accounts.length
            };
            const encrypted = this.encrypt(JSON.stringify(accountsData), password);
            fs.writeFileSync(this.configFile, encrypted);
            ui.showNotification('success', `Saved ${accounts.length} account configurations`);
            return true;
        } catch (error) {
            ui.showNotification('error', `Failed to save accounts: ${error.message}`);
            return false;
        }
    }

    loadMultipleAccounts(password) {
        try {
            if (!fs.existsSync(this.configFile)) {
                return [];
            }
            const encrypted = fs.readFileSync(this.configFile, 'utf8');
            const decrypted = this.decrypt(encrypted, password);
            const accountsData = JSON.parse(decrypted);
            
            if (accountsData.version === "2.0") {
                accountsData.accounts.forEach(acc => {
                    if (!acc.accountName) {
                        acc.accountName = 'Unnamed';
                    }
                });
                accountsData.version = "2.1";
            }
            
            return accountsData.accounts;
        } catch (error) {
            throw new Error(`Failed to load accounts: ${error.message}`);
        }
    }

    addAccount(newAccount, password) {
        try {
            const accounts = this.loadMultipleAccounts(password);
            
            const exists = accounts.some(acc => 
                acc.fromAddress === newAccount.fromAddress && 
                acc.network === newAccount.network &&
                acc.tokenAddress === newAccount.tokenAddress
            );
            
            if (exists) {
                ui.showNotification('warning', 'Account configuration already exists');
                return false;
            }
            
            accounts.push({
                ...newAccount,
                lastUsed: new Date().toLocaleString(),
                created: new Date().toISOString(),
                id: this.generateAccountId(newAccount.fromAddress, newAccount.network, newAccount.tokenAddress)
            });
            
            return this.saveMultipleAccounts(accounts, password);
        } catch (error) {
            ui.showNotification('error', `Failed to add account: ${error.message}`);
            return false;
        }
    }

    deleteAccount(accountIndex, password) {
        try {
            const accounts = this.loadMultipleAccounts(password);
            if (accountIndex >= 0 && accountIndex < accounts.length) {
                const deletedAccount = accounts.splice(accountIndex, 1)[0];
                this.saveMultipleAccounts(accounts, password);
                ui.showNotification('success', `Configuration for ${this.maskAddress(deletedAccount.fromAddress)} removed`);
                return true;
            }
            return false;
        } catch (error) {
            ui.showNotification('error', `Failed to delete account: ${error.message}`);
            return false;
        }
    }

    getAllAccounts(password) {
        return this.loadMultipleAccounts(password);
    }

    getAccountCount(password) {
        try {
            const accounts = this.loadMultipleAccounts(password);
            return accounts.length;
        } catch (error) {
            return 0;
        }
    }

    generateAccountId(fromAddress, network, tokenAddress = null) {
        const baseId = `${fromAddress}-${network}`;
        return tokenAddress ? `${baseId}-${tokenAddress}` : baseId;
    }

    maskAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    encrypt(text, password) {
        const salt = crypto.randomBytes(16);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        const result = { encrypted, iv: iv.toString('hex'), salt: salt.toString('hex'), authTag: authTag.toString('hex') };
        return Buffer.from(JSON.stringify(result)).toString('base64');
    }

    decrypt(encryptedData, password) {
        const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
        const salt = Buffer.from(data.salt, 'hex');
        const iv = Buffer.from(data.iv, 'hex');
        const authTag = Buffer.from(data.authTag, 'hex');
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

const enhancedConfigManager = new EnhancedSecureConfigManager();

// ===== SIMPLE TELEGRAM NOTIFIER =====
class TelegramNotifier {
    constructor(botToken, chatId) {
        this.botToken = botToken;
        this.chatId = chatId;
    }

    async sendNotification(message) {
        try {
            // const https = require('https'); // Sudah di-require di atas
            const data = JSON.stringify({ 
                chat_id: this.chatId,
                text: message, 
                parse_mode: 'HTML' 
            });
            
            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${this.botToken}/sendMessage`,
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Content-Length': Buffer.byteLength(data) 
                }
            };

            return new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let responseData = '';
                    res.on('data', (chunk) => responseData += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            resolve(true);
                        } else {
                            console.log('Telegram API Response:', responseData);
                            resolve(false);
                        }
                    });
                });

                req.on('error', (error) => {
                    console.log('Telegram Request Error:', error.message);
                    resolve(false);
                });
                
                req.setTimeout(10000, () => {
                    req.destroy();
                    resolve(false);
                });

                req.write(data);
                req.end();
            });
        } catch (error) {
            console.log('Telegram Error:', error.message);
            return false;
        }
    }

    formatTransferAlert(tokenInfo, amount, network, txHash = null) {
        return `🟢 TOKEN TRANSFER DETECTED

💰 Token: ${tokenInfo.name} (${tokenInfo.symbol})
🔢 Amount: ${amount} ${tokenInfo.symbol}
🌐 Network: ${network}
${txHash ? `📄 TX Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` : ''}
⏰ Time: ${new Date().toLocaleString()}

✅ Auto-forward process started...`;
    }

    formatForwardSuccess(tokenInfo, amount, txHash, network) {
        return `🎉 TRANSFER SUCCESSFUL

✅ Status: Completed
🪙 Token: ${tokenInfo.name} (${tokenInfo.symbol})
💰 Amount: ${amount} ${tokenInfo.symbol}
🌐 Network: ${network}
📄 TX Hash: ${txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : 'pending...'}
⏰ Completed: ${new Date().toLocaleString()}`;
    }

    formatBotStarted(mode, network, fromAddress, toAddress, tokenAddress = null, accountName = null) {
        return `🟡 BOT STARTED - ${mode}

🌐 Network: ${network}
📤 Wallet: ${this.maskAddress(fromAddress)}
📥 Destination: ${this.maskAddress(toAddress)}
${tokenAddress ? `🪙 Token: ${this.maskAddress(tokenAddress)}` : '🪙 Token: Auto-Detect All'}
${accountName ? `🏷️  Account: ${accountName}` : ''}
⏰ Started: ${new Date().toLocaleString()}

🔍 Monitoring for incoming tokens...`;
    }

    formatTokenDetected(token) {
        return `🎯 NEW TOKEN DETECTED

🪙 Token: ${token.name} (${token.symbol})
💰 Balance: ${token.balance} ${token.symbol}
📝 Contract: ${this.maskAddress(token.address)}
⏰ Detected: ${new Date().toLocaleString()}

🚀 Starting auto-transfer...`;
    }

    maskAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

// ===== NETWORK CONFIGURATION =====
const NETWORK_CONFIG = {
    BASE: { name: "Base Mainnet", chainId: 8453, explorer: "https://basescan.org", rpc: "https://mainnet.base.org" },
    ARBITRUM: { name: "Arbitrum Mainnet", chainId: 42161, explorer: "https://arbiscan.io", rpc: "https://arb1.arbitrum.io/rpc" },
    OPTIMISM: { name: "Optimism Mainnet", chainId: 10, explorer: "https://optimistic.etherscan.io", rpc: "https://mainnet.optimism.io" },
    POLYGON: { name: "Polygon Mainnet", chainId: 137, explorer: "https://polygonscan.com", rpc: "https://polygon-rpc.com" },
    ETHEREUM: { name: "Ethereum Mainnet", chainId: 1, explorer: "https://etherscan.io", rpc: "https://eth.llamarpc.com" }
};

// ===== TOKEN ABI =====
const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

// ===== UTILITY FUNCTIONS =====
async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function isValidPrivateKey(privateKey) {
    return typeof privateKey === 'string' && privateKey.startsWith('0x') && privateKey.length === 66;
}

function isValidAddress(address) {
    try { return ethers.isAddress(address); } catch { return false; }
}

// ===== SETUP PASSWORD =====
async function setupConfigurationPassword() {
    let password;
    let confirmPassword;
    
    while (true) {
        password = await input.question('🔐 Set configuration password (min 6 characters)');
        confirmPassword = await input.question('🔐 Confirm password');
        
        if (password === confirmPassword) {
            if (password.length >= 6) {
                break;
            } else {
                ui.showNotification('error', 'Password must be at least 6 characters long');
            }
        } else {
            ui.showNotification('error', 'Passwords do not match. Please try again.');
        }
    }
    
    return password;
}

// ===== LOAD ACCOUNTS =====
async function loadMultiAccountConfiguration() {
    try {
        const password = await input.question('🔑 Enter your configuration password');
        const accounts = enhancedConfigManager.loadMultipleAccounts(password);
        
        if (accounts.length === 0) {
            ui.showNotification('warning', 'No saved account configurations found');
            return null;
        }
        
        return { accounts, password };
    } catch (error) {
        ui.showNotification('error', `Failed to load configurations: ${error.message}`);
        return null;
    }
}

// ===== SETUP NEW ACCOUNT =====
async function setupNewAccount(mode, existingPassword = null) {
    ui.createMenu('🌐 SELECT NETWORK', 
        Object.keys(NETWORK_CONFIG).map(key => NETWORK_CONFIG[key].name),
        'Choose the blockchain network:'
    );
    
    let networkChoice;
    while (!networkChoice) {
        const choice = await input.question('Select network (1-5)');
        const networkKeys = Object.keys(NETWORK_CONFIG);
        const choiceNum = parseInt(choice);
        
        if (choiceNum >= 1 && choiceNum <= networkKeys.length) {
            networkChoice = networkKeys[choiceNum - 1];
        } else {
            ui.showNotification('error', 'Invalid choice. Please select 1-5');
        }
    }

    let tokenAddress = null;
    if (mode === '2' || mode === '3') {
        while (!tokenAddress) {
            tokenAddress = await input.question('🪙 Enter token contract address (0x...)');
            if (!isValidAddress(tokenAddress)) {
                ui.showNotification('error', 'Invalid token contract address');
                tokenAddress = null;
            }
        }
    }

    let destinationAddress;
    while (!destinationAddress) {
        destinationAddress = await input.question('📬 Enter destination address (0x...)');
        if (!isValidAddress(destinationAddress)) {
            ui.showNotification('error', 'Invalid Ethereum address');
            destinationAddress = null;
        }
    }

    let privateKey;
    while (!privateKey) {
        privateKey = await input.question('🔑 Enter your private key (0x...)');
        if (!isValidPrivateKey(privateKey)) {
            ui.showNotification('error', 'Invalid private key format');
            privateKey = null;
        }
    }

    let accountName;
    while (!accountName) {
        accountName = await input.question('🏷️  Enter account name (e.g., ICNT, MyWallet, etc)');
        if (!accountName || accountName.trim() === '') {
            ui.showNotification('error', 'Account name cannot be empty');
            accountName = null;
        }
    }

    const wallet = new ethers.Wallet(privateKey);
    const fromAddress = wallet.address;

    const userConfig = {
        network: networkChoice,
        destinationAddress: destinationAddress,
        privateKey: privateKey,
        fromAddress: fromAddress,
        tokenAddress: tokenAddress,
        accountName: accountName,
        lastUsed: new Date().toLocaleString()
    };

    ui.showAccountSummary({
        ...userConfig,
        network: NETWORK_CONFIG[networkChoice].name
    }, mode);

    const confirm = await input.question('Start bot with this configuration? (y/n)');
    
    if (confirm.toLowerCase() !== 'y') {
        ui.showNotification('warning', 'Account setup cancelled');
        return null;
    }

    let passwordToUse = existingPassword;
    if (!passwordToUse) {
        const saveChoice = await input.question('💾 Save this configuration securely with password? (y/n)');
        if (saveChoice.toLowerCase() === 'y') {
            passwordToUse = await setupConfigurationPassword();
        }
    }

    if (passwordToUse) {
        const saveSuccess = enhancedConfigManager.addAccount(userConfig, passwordToUse);
        if (saveSuccess) {
            ui.showNotification('success', 'Account configuration saved successfully!');
        } else {
            ui.showNotification('warning', 'Account configuration was not saved');
        }
    } else {
        ui.showNotification('info', 'Account configuration will not be saved');
    }

    return userConfig;
}

// ===== SELECT ACCOUNT =====
async function selectAccount(mode) {
    ui.startLoading('Loading account configurations');
    await sleep(1500);
    
    const loadedData = await loadMultiAccountConfiguration();
    if (!loadedData) {
        return await setupNewAccount(mode);
    }
    
    const { accounts, password } = loadedData;
    
    const filteredAccounts = accounts.filter(acc => {
        if (mode === '1') return !acc.tokenAddress; // ETH mode = no token address
        if (mode === '2' || mode === '3') return !!acc.tokenAddress; // Token mode = must have token address
        if (mode === '4') return true; // Auto-detect mode = works on any account
        return true;
    });
    
    if (filteredAccounts.length === 0) {
        ui.showNotification('warning', `No saved accounts found for this mode`);
        return await setupNewAccount(mode, password);
    }

    ui.stopLoading();
    
    const menuOptions = [
        ...filteredAccounts.map((acc, idx) => {
            const addressPart = ui.maskAddress(acc.fromAddress);
            const networkPart = acc.network;
            const typePart = acc.tokenAddress ? 'Token' : 'ETH';
            const namePart = acc.accountName || 'Unnamed';
            
            return `${addressPart} • ${networkPart} • ${typePart} • ${namePart}`;
        }),
        '➕ Add New Account Configuration'
    ];
    
    ui.createMenu('👥 SELECT ACCOUNT', menuOptions, 'Choose an existing account or add new:');

    let choice;
    while (true) {
        const inputChoice = await input.question(`Select account (1-${filteredAccounts.length + 1})`);
        const choiceNum = parseInt(inputChoice);
        
        if (choiceNum >= 1 && choiceNum <= filteredAccounts.length + 1) {
            choice = choiceNum;
            break;
        } else {
            ui.showNotification('error', `Please select 1-${filteredAccounts.length + 1}`);
        }
    }

    if (choice === filteredAccounts.length + 1) {
        return await setupNewAccount(mode, password);
    } else {
        const selectedAccount = filteredAccounts[choice - 1];
        
        selectedAccount.lastUsed = new Date().toLocaleString();
        const allAccounts = enhancedConfigManager.getAllAccounts(password);
        const accountIndex = allAccounts.findIndex(acc => acc.id === selectedAccount.id);
        if (accountIndex !== -1) {
            allAccounts[accountIndex] = selectedAccount;
            enhancedConfigManager.saveMultipleAccounts(allAccounts, password);
        }
        
        ui.showNotification('success', `Loaded: ${selectedAccount.accountName || ui.maskAddress(selectedAccount.fromAddress)}`);
        return selectedAccount;
    }
}

// ===== VIEW ACCOUNTS =====
async function viewAccountConfigurations() {
    const loadedData = await loadMultiAccountConfiguration();
    if (!loadedData) {
        return;
    }
    
    const { accounts } = loadedData;
    
    accounts.forEach((acc, index) => {
        const content = [
            `🌐 Network: ${acc.network}`,
            `📤 From: ${ui.maskAddress(acc.fromAddress)}`,
            `📥 To: ${ui.maskAddress(acc.destinationAddress)}`,
            acc.tokenAddress ? `🪙 Token: ${ui.maskAddress(acc.tokenAddress)}` : '🪙 Token: Auto-Detect',
            `🏷️  Account Name: ${acc.accountName || 'Unnamed'}`,
            `📅 Created: ${acc.created ? new Date(acc.created).toLocaleString() : 'Unknown'}`
        ];
        
        ui.createBox(`👤 ACCOUNT #${index + 1}`, content, 'info');
    });
    
    await input.question('Press Enter to continue...');
}

// ===== DELETE ACCOUNT CONFIGURATION =====
async function deleteAccountConfiguration() {
    const loadedData = await loadMultiAccountConfiguration();
    if (!loadedData) {
        return;
    }
    
    const { accounts, password } = loadedData;
    
    if (accounts.length === 0) {
        ui.showNotification('warning', 'No saved account configurations found');
        return;
    }

    const deleteOptions = accounts.map((acc, idx) => {
        const addressPart = ui.maskAddress(acc.fromAddress);
        const networkPart = acc.network;
        const typePart = acc.tokenAddress ? 'Token' : 'ETH';
        const namePart = acc.accountName || 'Unnamed';
        
        return `${addressPart} • ${networkPart} • ${typePart} • ${namePart}`;
    });

    ui.createMenu('🗑️ DELETE ACCOUNT CONFIGURATION', 
        deleteOptions,
        'Select account to remove:'
    );

    let choice;
    while (true) {
        const inputChoice = await input.question(`Select account to delete (1-${accounts.length})`);
        const choiceNum = parseInt(inputChoice);
        
        if (choiceNum >= 1 && choiceNum <= accounts.length) {
            choice = choiceNum;
            break;
        } else {
            ui.showNotification('error', `Please select 1-${accounts.length}`);
        }
    }

    const accountToDelete = accounts[choice - 1];
    const accountDisplayName = accountToDelete.accountName || ui.maskAddress(accountToDelete.fromAddress);
    const confirm = await input.question(`🚨 ARE YOU SURE you want to delete configuration for ${accountDisplayName}? (y/n)`);
    
    if (confirm.toLowerCase() === 'y') {
        if (enhancedConfigManager.deleteAccount(choice - 1, password)) {
            ui.showNotification('success', 'Configuration removed successfully');
        }
    } else {
        ui.showNotification('info', 'Account configuration preserved');
    }
}

// ===== TOKEN TRANSFER CLASS =====
class TokenTransfer {
    constructor(providerUrl, privateKey, chainId, networkName, telegramNotifier = null) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.networkName = networkName;
        this.telegramNotifier = telegramNotifier;
        this.gasOptimizer = new SimpleGasOptimizer(this.provider, chainId);
        this.isRunning = true;
        this.lastBalance = 0;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
    }

    async getTokenInfo(tokenAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const [name, symbol, decimals] = await Promise.all([
            tokenContract.name(), tokenContract.symbol(), tokenContract.decimals()
        ]);
        return { name, symbol, decimals: parseInt(decimals), contract: tokenContract };
    }

    async getTokenBalance(tokenAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const balance = await tokenContract.balanceOf(this.wallet.address);
        const tokenInfo = await this.getTokenInfo(tokenAddress);
        return {
            rawBalance: balance,
            formattedBalance: parseFloat(ethers.formatUnits(balance, tokenInfo.decimals)),
            symbol: tokenInfo.symbol
        };
    }

    async sendToken(tokenAddress, toAddress) {
        try {
            const tokenBalance = await this.getTokenBalance(tokenAddress);
            if (tokenBalance.formattedBalance <= 0) {
                return null;
            }

            const tokenInfo = await this.getTokenInfo(tokenAddress);
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
            
            const gasCost = await this.gasOptimizer.calculateTransactionCost(GAS_CONFIG.GAS_LIMIT);
            
            ui.showTransactionSummary(tokenInfo, tokenBalance.formattedBalance, gasCost, null, this.networkName);

            const currentNonce = await this.gasOptimizer.getCurrentNonce(this.wallet.address);
            
            if (this.telegramNotifier) {
                const gasPrice = await this.gasOptimizer.getOptimalGasPrice();
                
                const tx = await tokenContract.transfer(toAddress, tokenBalance.rawBalance, { 
                    gasPrice,
                    nonce: currentNonce
                });
                
                this.gasOptimizer.updateNonce(this.wallet.address);

                await this.telegramNotifier.sendNotification(
                    this.telegramNotifier.formatTransferAlert(
                        tokenInfo, 
                        tokenBalance.formattedBalance, 
                        this.networkName,
                        tx.hash
                    )
                );

                ui.startLoading('Confirming transaction');
                const receipt = await tx.wait();

                ui.stopLoading();
                ui.showNotification('success', `Successfully sent ${tokenBalance.formattedBalance} ${tokenInfo.symbol}`);
                this.consecutiveErrors = 0;

                if (this.telegramNotifier) {
                    await this.telegramNotifier.sendNotification(
                        this.telegramNotifier.formatForwardSuccess(
                            tokenInfo, 
                            tokenBalance.formattedBalance, 
                            receipt.hash,
                            this.networkName
                        )
                    );
                }

                return { hash: receipt.hash, amount: tokenBalance.formattedBalance, symbol: tokenInfo.symbol };
            } else {
                ui.startLoading('Sending transaction');
                
                const gasPrice = await this.gasOptimizer.getOptimalGasPrice();
                
                const tx = await tokenContract.transfer(toAddress, tokenBalance.rawBalance, { 
                    gasPrice,
                    nonce: currentNonce
                });
                
                this.gasOptimizer.updateNonce(this.wallet.address);
                
                ui.startLoading('Confirming transaction');
                const receipt = await tx.wait();

                ui.stopLoading();
                ui.showNotification('success', `Successfully sent ${tokenBalance.formattedBalance} ${tokenInfo.symbol}`);
                this.consecutiveErrors = 0;

                return { hash: receipt.hash, amount: tokenBalance.formattedBalance, symbol: tokenInfo.symbol };
            }
            
        } catch (error) {
            this.consecutiveErrors++;
            ui.stopLoading();
            
            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                ui.showNotification('error', `Too many consecutive errors. Stopping bot.`);
                this.stop();
                return null;
            }

            if (error.message.includes('nonce') || error.message.includes('NONCE_EXPIRED')) {
                ui.showNotification('warning', 'Nonce error detected. Clearing cache...');
                this.gasOptimizer.clearNonceCache(this.wallet.address);
                await sleep(2000);
            } else {
                ui.showNotification('error', `Transfer failed: ${error.message}`);
            }
            
            return null;
        }
    }

    async checkAndForward(tokenAddress, toAddress) {
        try {
            const tokenBalance = await this.getTokenBalance(tokenAddress);
            
            if (tokenBalance.formattedBalance <= 0) {
                ui.startLoading(`Monitoring ${tokenBalance.symbol} - Balance: 0`);
                this.lastBalance = 0;
                this.consecutiveErrors = 0;
                return;
            }

            if (this.lastBalance === 0 && tokenBalance.formattedBalance > 0) {
                await this.sendToken(tokenAddress, toAddress);
            }
            
            this.lastBalance = tokenBalance.formattedBalance;
            
        } catch (error) {
            this.consecutiveErrors++;
            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                ui.showNotification('error', `Too many monitoring errors. Stopping bot.`);
                this.stop();
                return;
            }
            ui.startLoading('Monitoring tokens - Checking balance...');
        }
    }

    startAutoForward(tokenAddress, toAddress, accountName = null) {
        ui.showNotification('info', `Started token monitoring on ${this.networkName}`);
        
        if (this.telegramNotifier) {
            this.telegramNotifier.sendNotification(
                this.telegramNotifier.formatBotStarted(
                    'TOKEN AUTO-FORWARD',
                    this.networkName,
                    this.wallet.address,
                    toAddress,
                    tokenAddress,
                    accountName
                )
            );
        }

        this.checkAndForward(tokenAddress, toAddress);
        
        this.intervalId = setInterval(() => {
            if (this.isRunning) this.checkAndForward(tokenAddress, toAddress);
        }, GAS_CONFIG.CHECK_INTERVAL_MS);
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) clearInterval(this.intervalId);
        ui.stopLoading();
        ui.showNotification('info', 'Token monitoring stopped');
    }
}

// ===== ETH TRANSFER CLASS =====
class EthTransfer {
    constructor(providerUrl, privateKey, chainId, networkName, telegramNotifier = null) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.networkName = networkName;
        this.telegramNotifier = telegramNotifier;
        this.gasOptimizer = new SimpleGasOptimizer(this.provider, chainId);
        this.isRunning = true;
        this.lastBalance = 0;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
    }

    async getEthBalance() {
        const balance = await this.provider.getBalance(this.wallet.address);
        return parseFloat(ethers.formatEther(balance));
    }

    async sendEth(toAddress) {
        try {
            const ethBalance = await this.getEthBalance();
            const minBalance = parseFloat(GAS_CONFIG.MIN_ETH_BALANCE);
            
            if (ethBalance <= minBalance) {
                return null;
            }

            const amountToSend = ethBalance - minBalance;
            const gasCost = await this.gasOptimizer.calculateTransactionCost(GAS_CONFIG.GAS_LIMIT);
            
            ui.showTransactionSummary({ name: 'Ethereum', symbol: 'ETH' }, amountToSend, gasCost, null, this.networkName);

            const currentNonce = await this.gasOptimizer.getCurrentNonce(this.wallet.address);

            if (this.telegramNotifier) {
                const gasPrice = await this.gasOptimizer.getOptimalGasPrice();
                
                const tx = await this.wallet.sendTransaction({
                    to: toAddress,
                    value: ethers.parseEther(amountToSend.toString()),
                    gasPrice: gasPrice,
                    nonce: currentNonce
                });

                this.gasOptimizer.updateNonce(this.wallet.address);

                await this.telegramNotifier.sendNotification(
                    `🟢 ETH TRANSFER DETECTED\n\n💰 Amount: ${amountToSend} ETH\n🌐 Network: ${this.networkName}\n📄 TX Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}\n⏰ Time: ${new Date().toLocaleString()}`
                );

                ui.startLoading('Confirming transaction');
                const receipt = await tx.wait();

                ui.stopLoading();
                ui.showNotification('success', `Successfully sent ${amountToSend} ETH`);
                this.consecutiveErrors = 0;

                await this.telegramNotifier.sendNotification(
                    `🎉 ETH TRANSFER SUCCESSFUL\n\n✅ Status: Completed\n💰 Amount: ${amountToSend} ETH\n🌐 Network: ${this.networkName}\n📄 TX Hash: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}\n⏰ Completed: ${new Date().toLocaleString()}`
                );

                return { hash: receipt.hash, amount: amountToSend, symbol: 'ETH' };
            } else {
                ui.startLoading('Sending ETH transaction');
                
                const gasPrice = await this.gasOptimizer.getOptimalGasPrice();
                
                const tx = await this.wallet.sendTransaction({
                    to: toAddress,
                    value: ethers.parseEther(amountToSend.toString()),
                    gasPrice: gasPrice,
                    nonce: currentNonce
                });
                
                this.gasOptimizer.updateNonce(this.wallet.address);
                
                ui.startLoading('Confirming transaction');
                const receipt = await tx.wait();

                ui.stopLoading();
                ui.showNotification('success', `Successfully sent ${amountToSend} ETH`);
                this.consecutiveErrors = 0;

                return { hash: receipt.hash, amount: amountToSend, symbol: 'ETH' };
            }
            
        } catch (error) {
            this.consecutiveErrors++;
            ui.stopLoading();
            
            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                ui.showNotification('error', `Too many consecutive errors. Stopping bot.`);
                this.stop();
                return null;
            }

            if (error.message.includes('nonce') || error.message.includes('NONCE_EXPIRED')) {
                ui.showNotification('warning', 'Nonce error detected. Clearing cache...');
                this.gasOptimizer.clearNonceCache(this.wallet.address);
                await sleep(2000);
            } else {
                ui.showNotification('error', `ETH transfer failed: ${error.message}`);
            }
            
            return null;
        }
    }

    async checkAndForward(toAddress) {
        try {
            const ethBalance = await this.getEthBalance();
            const minBalance = parseFloat(GAS_CONFIG.MIN_ETH_BALANCE);
            
            if (ethBalance <= minBalance) {
                ui.startLoading(`Monitoring ETH - Balance: ${ethBalance.toFixed(8)} ETH`);
                this.lastBalance = ethBalance;
                this.consecutiveErrors = 0;
                return;
            }

            if (this.lastBalance <= minBalance && ethBalance > minBalance) {
                await this.sendEth(toAddress);
            }
            
            this.lastBalance = ethBalance;
            
        } catch (error) {
            this.consecutiveErrors++;
            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                ui.showNotification('error', `Too many monitoring errors. Stopping bot.`);
                this.stop();
                return;
            }
            ui.startLoading('Monitoring ETH - Checking balance...');
        }
    }

    startAutoForward(toAddress, accountName = null) {
        ui.showNotification('info', `Started ETH monitoring on ${this.networkName}`);
        
        if (this.telegramNotifier) {
            this.telegramNotifier.sendNotification(
                this.telegramNotifier.formatBotStarted(
                    'ETH AUTO-FORWARD',
                    this.networkName,
                    this.wallet.address,
                    toAddress,
                    null,
                    accountName
                )
            );
        }

        this.checkAndForward(toAddress);
        
        this.intervalId = setInterval(() => {
            if (this.isRunning) this.checkAndForward(toAddress);
        }, GAS_CONFIG.CHECK_INTERVAL_MS);
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) clearInterval(this.intervalId);
        ui.stopLoading();
        ui.showNotification('info', 'ETH monitoring stopped');
    }
}

// ===== AUTO TOKEN DETECTION MANAGER =====
class AutoTokenDetectionManager {
    constructor(providerUrl, privateKey, chainId, networkName, telegramNotifier = null) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.networkName = networkName;
        this.telegramNotifier = telegramNotifier;
        this.gasOptimizer = new SimpleGasOptimizer(this.provider, chainId);
        this.tokenDetector = new AdvancedTokenDetector(this.provider, this.wallet.address);
        this.isRunning = true;
        this.scanInterval = null;
    }

    async startAutoDetection(toAddress, accountName = null) {
        ui.showNotification('info', `🚀 Starting Auto Token Detection on ${this.networkName}`);
        
        if (this.telegramNotifier) {
            await this.telegramNotifier.sendNotification(
                this.telegramNotifier.formatBotStarted(
                    'AUTO TOKEN DETECTION',
                    this.networkName,
                    this.wallet.address,
                    toAddress,
                    null,
                    accountName
                )
            );
        }

        // Initial comprehensive scan
        ui.showNotification('info', '🔍 Performing initial token scan...');
        const initialTokens = await this.tokenDetector.comprehensiveScan(this.networkName);
        
        if (initialTokens.length > 0) {
            ui.showTokenScanResults(initialTokens);
            ui.showNotification('success', `🎯 Found ${initialTokens.length} token(s) with balance - Starting transfers...`);
            
            // Transfer all found tokens
            for (const token of initialTokens) {
                await this.transferToken(token, toAddress);
                await sleep(5000); // Delay 5 detik antara transfer
            }
        } else {
            ui.showNotification('info', 'No tokens with balance found in initial scan');
        }

        ui.showNotification('success', '🔄 Starting continuous monitoring for new tokens...');

        // Start continuous monitoring
        this.scanInterval = this.tokenDetector.startContinuousScan(
            this.networkName,
            async (newToken) => {
                ui.showNotification('success', `🎯 New token detected: ${newToken.symbol} - ${newToken.balance}`);
                
                if (this.telegramNotifier) {
                    await this.telegramNotifier.sendNotification(
                        this.telegramNotifier.formatTokenDetected(newToken)
                    );
                }
                
                await this.transferToken(newToken, toAddress);
            },
            30000 // Scan every 30 seconds
        );

        ui.createBox('🎯 AUTO TOKEN DETECTION ACTIVE', [
            `🌐 Network: ${this.networkName}`,
            `📤 From: ${ui.maskAddress(this.wallet.address)}`,
            `📥 To: ${ui.maskAddress(toAddress)}`,
            `🪙 Tokens: Auto-Detect All`,
            `🏷️  Account: ${accountName || 'Unnamed'}`,
            `⏰ Scan Interval: 30 seconds`,
            `🔍 Monitoring: USDC, USDT, WETH, DAI, WBTC, etc`,
            `📊 Initial Scan: ${initialTokens.length} tokens found`,
            `⏸️  Press Ctrl+C to stop`
        ], 'success');
    }

    async transferToken(token, toAddress) {
        try {
            ui.startLoading(`🔄 Transferring ${token.balance} ${token.symbol}...`);
            
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.wallet);
            
            // Get current balance to ensure we have the latest
            const currentBalance = await tokenContract.balanceOf(this.wallet.address);
            const currentBalanceFormatted = parseFloat(ethers.formatUnits(currentBalance, token.decimals));
            
            if (currentBalanceFormatted <= 0) {
                ui.stopLoading();
                ui.showNotification('warning', `No balance for ${token.symbol}`);
                return;
            }

            const gasCost = await this.gasOptimizer.calculateTransactionCost(GAS_CONFIG.GAS_LIMIT);
            
            ui.showTransactionSummary(token, currentBalanceFormatted, gasCost, null, this.networkName);

            const currentNonce = await this.gasOptimizer.getCurrentNonce(this.wallet.address);
            const gasPrice = await this.gasOptimizer.getOptimalGasPrice();

            ui.startLoading('Sending transaction...');
            const tx = await tokenContract.transfer(toAddress, currentBalance, { 
                gasPrice: gasPrice,
                gasLimit: GAS_CONFIG.GAS_LIMIT,
                nonce: currentNonce
            });

            this.gasOptimizer.updateNonce(this.wallet.address);

            if (this.telegramNotifier) {
                await this.telegramNotifier.sendNotification(
                    this.telegramNotifier.formatTransferAlert(
                        token, 
                        currentBalanceFormatted, 
                        this.networkName,
                        tx.hash
                    )
                );
            }

            ui.startLoading('⏳ Waiting for transaction confirmation...');
            const receipt = await tx.wait();

            ui.stopLoading();
            ui.showNotification('success', `✅ Successfully sent ${currentBalanceFormatted} ${token.symbol}`);
            ui.showNotification('info', `📄 Transaction confirmed in block ${receipt.blockNumber}`);

            if (this.telegramNotifier) {
                await this.telegramNotifier.sendNotification(
                    this.telegramNotifier.formatForwardSuccess(
                        token, 
                        currentBalanceFormatted, 
                        receipt.hash,
                        this.networkName
                    )
                );
            }

        } catch (error) {
            ui.stopLoading();
            ui.showNotification('error', `❌ Failed to transfer ${token.symbol}: ${error.message}`);
            
            // Clear nonce cache on error
            if (error.message.includes('nonce') || error.message.includes('replacement')) {
                this.gasOptimizer.clearNonceCache(this.wallet.address);
                ui.showNotification('warning', '🔄 Nonce cache cleared due to error');
            }
        }
    }

    stop() {
        this.isRunning = false;
        if (this.scanInterval) clearInterval(this.scanInterval);
        ui.stopLoading();
        ui.showNotification('info', '🛑 Auto Token Detection stopped');
    }
}

// ===== TELEGRAM SETUP =====
async function setupTelegramNotifier() {
    const TELEGRAM_BOT_TOKEN = "7997047144:AAE_tDQDqcnkIe-Z7o59cLPbJG8AsPgRVkw";
    let telegramNotifier = null;

    const enableTelegram = await input.question('Enable Telegram notifications? (y/n)');
    if (enableTelegram.toLowerCase() === 'y') {
        const chatId = await input.question('Your Chat ID');
        telegramNotifier = new TelegramNotifier(TELEGRAM_BOT_TOKEN, chatId);
        
        ui.startLoading('Testing Telegram connection...');
        const testResult = await telegramNotifier.sendNotification(
            '🔔 FA STARX BOT v9.2 ACTIVATED\n\n' +
            'Auto Token Detection Enabled!\n' +
            'Enhanced Token Scanner Ready!\n\n' +
            '⏰ ' + new Date().toLocaleString()
        );
        
        if (testResult) {
            ui.showNotification('success', '✅ Telegram connected! Notifications enabled.');
        } else {
            ui.showNotification('error', '❌ Failed to connect to Telegram. Check your Chat ID.');
            telegramNotifier = null;
        }
    }

    return telegramNotifier;
}

// ===== MAIN EXECUTION FUNCTIONS =====
// (Ini adalah fungsi-fungsi yang *berfungsi* dari file asli Anda)
async function runEthAutoForward(config, telegramNotifier) {
    const network = NETWORK_CONFIG[config.network];
    const ethTransfer = new EthTransfer(network.rpc, config.privateKey, network.chainId, network.name, telegramNotifier);
    
    try {
        ethTransfer.startAutoForward(config.destinationAddress, config.accountName);
        
        ui.showNotification('info', `ETH Auto-Forward started. Monitoring balance every ${GAS_CONFIG.CHECK_INTERVAL_MS/1000} seconds`);
        ui.createBox('🔄 ETH AUTO-FORWARD ACTIVE', [
            `🌐 Network: ${network.name}`,
            `📤 From: ${ui.maskAddress(config.fromAddress)}`,
            `📥 To: ${ui.maskAddress(config.destinationAddress)}`,
            `💰 Min Balance: ${GAS_CONFIG.MIN_ETH_BALANCE} ETH`,
            `🏷️  Account: ${config.accountName || 'Unnamed'}`,
            `⏰ Check Interval: ${GAS_CONFIG.CHECK_INTERVAL_MS/1000}s`,
            `⏸️  Press Ctrl+C to stop`
        ], 'success');
        
        while (true) {
            await sleep(60000);
        }
    } catch (error) {
        ui.showNotification('error', `ETH Auto-Forward error: ${error.message}`);
    }
}

async function runTokenAutoForward(config, telegramNotifier) {
    const network = NETWORK_CONFIG[config.network];
    const tokenTransfer = new TokenTransfer(network.rpc, config.privateKey, network.chainId, network.name, telegramNotifier);
    
    try {
        tokenTransfer.startAutoForward(config.tokenAddress, config.destinationAddress, config.accountName);
        
        ui.showNotification('info', `Token Auto-Forward started. Monitoring every ${GAS_CONFIG.CHECK_INTERVAL_MS/1000} seconds`);
        ui.createBox('🔄 TOKEN AUTO-FORWARD ACTIVE', [
            `🌐 Network: ${network.name}`,
            `📤 From: ${ui.maskAddress(config.fromAddress)}`,
            `📥 To: ${ui.maskAddress(config.destinationAddress)}`,
            `🪙 Token: ${ui.maskAddress(config.tokenAddress)}`,
            `🏷️  Account: ${config.accountName || 'Unnamed'}`,
            `⏰ Check Interval: ${GAS_CONFIG.CHECK_INTERVAL_MS/1000}s`,
            `⏸️  Press Ctrl+C to stop`
        ], 'success');
        
        while (true) {
            await sleep(60000);
        }
    } catch (error) {
        ui.showNotification('error', `Token Auto-Forward error: ${error.message}`);
    }
}

async function runTokenTransferOnce(config, telegramNotifier) {
    const network = NETWORK_CONFIG[config.network];
    const tokenTransfer = new TokenTransfer(network.rpc, config.privateKey, network.chainId, network.name, telegramNotifier);
    
    try {
        const result = await tokenTransfer.sendToken(config.tokenAddress, config.destinationAddress);
        
        if (result) {
            ui.showNotification('success', `Successfully transferred ${result.amount} ${result.symbol}`);
        } else {
            ui.showNotification('warning', 'No tokens available to transfer');
        }
    } catch (error) {
        ui.showNotification('error', `Token transfer failed: ${error.message}`);
    }
}

// ===== MODE 4: AUTO TOKEN DETECTION =====
async function runAutoTokenDetection(config, telegramNotifier) {
    const network = NETWORK_CONFIG[config.network];
    const detectionManager = new AutoTokenDetectionManager(network.rpc, config.privateKey, network.chainId, network.name, telegramNotifier);
    
    try {
        await detectionManager.startAutoDetection(config.destinationAddress, config.accountName);
        
        // Keep the process running
        while (true) {
            await sleep(60000);
            // Show heartbeat every minute
            ui.startLoading('🔄 Auto Token Detection active - Monitoring for new tokens...');
            await sleep(2000);
            ui.stopLoading();
        }
    } catch (error) {
        ui.showNotification('error', `Auto Token Detection error: ${error.message}`);
    }
}

// ===== GITHUB PASSWORD SYNC SYSTEM WITH FULL ENCRYPTION =====
// (Ini adalah sistem keamanan baru Anda, ditempatkan di sini agar bisa diakses oleh main())
class GitHubPasswordSync {
    constructor() {
        // 8 FILE KEAMANAN YANG SALING BACKUP
        this.securityFiles = [
            '.security-system-marker',
            '.secure-backup-marker', 
            '.fastarx-ultra-secure',
            '.system-integrity-check',
            '.permanent-security',
            '.admin-password-secure',
            '.github-validation-lock',
            '.dual-backup-evidence'
        ];
        
        // 2 SUMBER GITHUB UNTUK VALIDASI
        this.githubSources = [
            {
                name: "MAIN",
                url: "https://raw.githubusercontent.com/ferystarx7/project-cripto/main/security-config.json"
            },
            {
                name: "BACKUP", 
                url: "https://raw.githubusercontent.com/ferystarx/scryty/main/shelo.json"
            }
        ];
        
        // Password default HANYA untuk setup pertama kali
        this.adminPassword = "FAstrike7";
        this.scriptPassword = "22310888F";
        
        this.githubStatus = {
            MAIN: { connected: false, password: null },
            BACKUP: { connected: false, password: null }
        };
        this.consensusAchieved = false;
        
        // **BARU: Status kunci sistem jika terjadi tampering**
        this.systemLocked = false; 
        
        this.encryptionConfig = {
            algorithm: 'aes-256-gcm',
            keyIterations: 100000,
            keyLength: 32,
            salt: 'FASTARX_SECURE_SALT_2024',
            digest: 'sha256'
        };

        this.masterKey = this.generateMasterKey();
    }

    generateMasterKey() {
        return crypto.pbkdf2Sync(
            'FASTARX_SECURE_MASTER_KEY_2024',
            this.encryptionConfig.salt,
            this.encryptionConfig.keyIterations,
            this.encryptionConfig.keyLength,
            this.encryptionConfig.digest
        );
    }

    encryptData(plaintext) {
        try {
            const key = this.masterKey;
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.encryptionConfig.algorithm, key, iv);
            
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.encryptionConfig.algorithm,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error('Encryption failed');
        }
    }

    decryptData(encryptedData) {
        try {
            const key = this.masterKey;
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const authTag = Buffer.from(encryptedData.authTag, 'hex');
            
            const decipher = crypto.createDecipheriv(this.encryptionConfig.algorithm, key, iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    // **DIUBAH: Logika inisialisasi untuk memeriksa integritas file**
    async initialize() {
        console.log('🚀 INITIALIZING SECURITY SYSTEM...');
        
        // 1. Periksa Integritas File (Pemeriksaan Tampering)
        const fileStatus = this.checkFileStatus();
        
        if (fileStatus.missing > 0) {
            if (fileStatus.existing === 0) {
                // KASUS 1: Setup Pertama Kali (Semua file tidak ada)
                ui.showNotification('info', '📁 No security files found. Running first-time setup...');
                await this.createSecurityFiles();
                ui.showNotification('warning', '⚠️ Default passwords created. Please log in and change them.');
            } else {
                // KASUS 2: Tampering (Sebagian file hilang)
                ui.showNotification('error', '🚫 TAMPERING DETECTED! Security file(s) missing. System locked.');
                this.systemLocked = true;
                return; // Hentikan inisialisasi
            }
        } else {
            console.log('✅ Security file integrity check passed.');
        }
        
        // 2. Baca Password (Sekarang aman untuk dibaca)
        await this.readPasswordsFromFiles();
        
        // 3. Validasi GitHub
        const validationResult = await this.validateGitHubSources();
        
        if (validationResult.validated) {
            ui.showNotification('success', '✅ GitHub validation successful!');
        }
        
        this.showSecurityStatus();
        return true;
    }

    async createSecurityFiles() {
        console.log('📁 Creating security files...');
        
        let createdCount = 0;
        const timestamp = new Date().toISOString();
        
        for (const file of this.securityFiles) {
            const filePath = path.join(__dirname, file);
            
            if (!fs.existsSync(filePath)) {
                try {
                    let fileData = {};
                    
                    if (file === '.admin-password-secure') {
                        fileData = {
                            password: this.adminPassword,
                            timestamp: timestamp,
                            type: 'ADMIN_PASSWORD',
                            securityLevel: 'HIGH'
                        };
                    } else {
                        fileData = {
                            password: this.scriptPassword,
                            timestamp: timestamp,
                            type: 'SECURITY_FILE',
                            filePurpose: file,
                            securityLevel: 'HIGH'
                        };
                    }
                    
                    // Buat file cadangan admin password juga
                    if (file === '.secure-backup-marker' || file === '.system-integrity-check') {
                        fileData = {
                            ...fileData, // simpan data asli
                            password: this.adminPassword, // timpa dengan password admin
                            timestamp: timestamp,
                            type: 'ADMIN_PASSWORD',
                            isBackup: true
                        };
                    }

                    const encryptedData = this.encryptData(JSON.stringify(fileData));
                    
                    const finalData = {
                        ...encryptedData,
                        metadata: {
                            system: 'FA_STARX_BOT',
                            created: timestamp,
                            version: '1.0'
                        }
                    };
                    
                    fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2));
                    console.log(`✅ Created: ${file}`);
                    createdCount++;
                    
                } catch (error) {
                    console.log(`❌ Failed to create ${file}`);
                }
            }
        }
        
        if (createdCount > 0) {
            console.log(`🎯 ${createdCount} security files created`);
        }
    }

    // **DIUBAH: Membaca password admin secara redundan dari 3 file**
    async readPasswordsFromFiles() {
        console.log('🔑 Reading passwords from security files...');
        
        const adminFiles = ['.admin-password-secure', '.secure-backup-marker', '.system-integrity-check'];
        const scriptFiles = this.securityFiles.filter(f => !adminFiles.includes(f));
        
        let adminFound = false;
        let scriptFound = false;
        
        // Coba baca password admin dari file utama atau cadangan
        for (const file of adminFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(content);
                    const decrypted = this.decryptData(data);
                    const fileData = JSON.parse(decrypted);
                    
                    if (fileData.password && fileData.type === 'ADMIN_PASSWORD') {
                        this.adminPassword = fileData.password;
                        adminFound = true;
                        console.log(`🔑 Admin password loaded from: ${file}`);
                        break; // Berhenti jika sudah ketemu
                    }
                } catch (error) {
                    console.log(`⚠️ Failed to read/decrypt ${file}, trying next...`);
                }
            }
        }

        if (!adminFound) {
            console.log('❌ CRITICAL: Could not load admin password from any source file.');
            // Biarkan default, tapi sistem akan lock jika file hilang
        }
        
        // Coba baca script password dari file sisanya
        for (const file of scriptFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(content);
                    const decrypted = this.decryptData(data);
                    const fileData = JSON.parse(decrypted);
                    
                    if (fileData.password && fileData.type === 'SECURITY_FILE') {
                        this.scriptPassword = fileData.password;
                        scriptFound = true;
                        console.log(`🔑 Script password loaded from: ${file}`);
                        break; // Berhenti jika sudah ketemu
                    }
                } catch (error) {
                    // Lanjut ke file berikutnya
                }
            }
        }
        
        if (!scriptFound) {
             console.log('❌ Could not load script password from any source file.');
        }
    }

    async validateGitHubSources() {
        ui.startLoading('🔍 Validating GitHub sources...');
        
        try {
            const results = await Promise.allSettled([
                this.fetchGitHubConfig(this.githubSources[0]),
                this.fetchGitHubConfig(this.githubSources[1])
            ]);
            
            const validResults = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const source = this.githubSources[index];
                    this.githubStatus[source.name] = {
                        connected: true,
                        password: result.value
                    };
                    validResults.push(result.value);
                    console.log(`✅ ${source.name}: Connected`);
                } else {
                    const source = this.githubSources[index];
                    this.githubStatus[source.name] = {
                        connected: false,
                        password: null
                    };
                    console.log(`❌ ${source.name}: Offline`);
                }
            });
            
            ui.stopLoading();
            
            // Jika kedua GitHub connected dan password sama
            if (validResults.length === 2 && validResults[0] === validResults[1]) {
                this.consensusAchieved = true;
                this.scriptPassword = validResults[0];
                await this.updateSecurityFilesWithGitHubPassword(validResults[0]);
                
                return {
                    validated: true,
                    message: 'Dual GitHub validation passed'
                };
            }
            
            return {
                validated: false,
                message: `GitHub status: ${validResults.length}/2 connected`
            };
            
        } catch (error) {
            ui.stopLoading();
            return {
                validated: false,
                message: 'Validation error'
            };
        }
    }

    async fetchGitHubConfig(source) {
        return new Promise((resolve, reject) => {
            const url = new URL(source.url);
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: 'GET',
                headers: {
                    'User-Agent': 'FASTARX-BOT/1.0'
                },
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const config = JSON.parse(data);
                            const password = this.extractPassword(config);
                            if (password) {
                                resolve(password);
                            } else {
                                reject(new Error('No password found'));
                            }
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(new Error('Parse error'));
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            
            req.end();
        });
    }

    extractPassword(config) {
        if (config.scriptPassword) return config.scriptPassword;
        if (config.password) return config.password;
        if (config.security && config.security.password) return config.security.password;
        return null;
    }

    async updateSecurityFilesWithGitHubPassword(newPassword) {
        console.log('🔄 Updating security files with GitHub password...');
        
        const timestamp = new Date().toISOString();
        const adminFiles = ['.admin-password-secure', '.secure-backup-marker', '.system-integrity-check'];

        for (const file of this.securityFiles) {
            // Jangan timpa file admin password
            if (adminFiles.includes(file)) continue; 
            
            const filePath = path.join(__dirname, file);
            try {
                let fileData = {
                    password: newPassword,
                    timestamp: timestamp,
                    type: 'SECURITY_FILE',
                    filePurpose: file,
                    securityLevel: 'GITHUB_VALIDATED',
                    validatedBy: 'DUAL_GITHUB'
                };
                
                const encryptedData = this.encryptData(JSON.stringify(fileData));
                
                const finalData = {
                    ...encryptedData,
                    metadata: {
                        system: 'FA_STARX_BOT',
                        created: timestamp,
                        githubValidated: true
                    }
                };
                
                fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2));
                
            } catch (error) {
                console.log(`❌ Failed to update ${file}`);
            }
        }
        
        this.scriptPassword = newPassword;
        console.log('✅ Script password files updated with GitHub password');
    }

    async showLoginOptions() {
        ui.createBox('🔐 SECURE LOGIN', [
            'FA STARX BOT SECURITY SYSTEM',
            '',
            '🔑 Login Methods:',
            '1. Administrator Access',
            '2. Script Password Access',
            '',
            'Select login method:'
        ], 'info');

        const choice = await input.question('Select option (1-2): ');
        return choice;
    }

    async loginWithAdmin() {
        ui.createBox('🔐 ADMINISTRATOR LOGIN', [
            'Full System Access',
            '',
            '⚠️  Requires admin password',
            '🔒 Secure authentication',
            '',
            'Enter administrator password:'
        ], 'warning');

        let attempts = 0;
        while (attempts < 3) {
            const inputPassword = await input.question('🔐 Admin Password: ');
            
            if (inputPassword === this.adminPassword) {
                return { success: true, accessLevel: 'admin' };
            } else {
                attempts++;
                const remaining = 3 - attempts;
                if (remaining > 0) {
                    ui.showNotification('error', `Wrong password. ${remaining} attempts left`);
                } else {
                    ui.showNotification('error', '🚫 ACCESS DENIED');
                    return { success: false, accessLevel: 'admin' };
                }
            }
        }
        return { success: false, accessLevel: 'admin' };
    }

    async loginWithScript() {
        ui.createBox('🔐 SCRIPT LOGIN', [
            'Standard Bot Access',
            '',
            '📋 Available Features:',
            '• ETH Auto-Forward',
            '• Token Operations',
            '• Auto Detection',
            '',
            'Enter script password:'
        ], 'info');

        let attempts = 0;
        while (attempts < 3) {
            const inputPassword = await input.question('🔐 Script Password: ');
            
            if (inputPassword === this.scriptPassword) {
                return { success: true, accessLevel: 'script' };
            } else {
                attempts++;
                const remaining = 3 - attempts;
                if (remaining > 0) {
                    ui.showNotification('error', `Wrong password. ${remaining} attempts left`);
                } else {
                    ui.showNotification('error', '🚫 ACCESS DENIED');
                    return { success: false, accessLevel: 'script' };
                }
            }
        }
        return { success: false, accessLevel: 'script' };
    }

    // **DIUBAH: Tambahkan pemeriksaan `systemLocked`**
    async verifyAccess() {
        if (this.systemLocked) {
            ui.showNotification('error', 'System is locked due to file tampering. Exiting.');
            await sleep(3000); // Beri waktu user untuk membaca
            process.exit(1);
        }
        
        const loginChoice = await this.showLoginOptions();
        
        if (loginChoice === '1') {
            return await this.loginWithAdmin();
        } else if (loginChoice === '2') {
            return await this.loginWithScript();
        } else {
            ui.showNotification('error', 'Invalid selection');
            return await this.verifyAccess();
        }
    }

    async changeAdminPassword() {
        ui.createBox('🔐 CHANGE ADMIN PASSWORD', [
            'Admin Password Update',
            '',
            'Enter current admin password:'
        ], 'info');

        const currentPassword = await input.question('🔐 Current Password: ');
        if (currentPassword !== this.adminPassword) {
            ui.showNotification('error', '❌ Current password is incorrect');
            return false;
        }

        let newPassword, confirmPassword;
        
        while (true) {
            newPassword = await input.question('🔐 New Admin Password: ');
            
            if (newPassword.length < 6) {
                ui.showNotification('error', '❌ Password must be at least 6 characters');
                continue;
            }
            
            confirmPassword = await input.question('🔐 Confirm New Password: ');
            
            if (newPassword !== confirmPassword) {
                ui.showNotification('error', '❌ Passwords do not match');
            } else {
                break;
            }
        }

        ui.createBox('🔐 CONFIRM PASSWORD CHANGE', [
            'Admin Password Change Confirmation',
            '',
            'New password will be encrypted and saved.',
            '',
            'Type "YES" to confirm:'
        ], 'warning');

        const confirm = await input.question('Type "YES" to confirm: ');
        if (confirm !== 'YES') {
            ui.showNotification('info', 'Password change cancelled');
            return false;
        }

        ui.startLoading('💾 Saving new password...');
        
        try {
            this.adminPassword = newPassword;
            // Panggil fungsi save utama, yang juga akan memanggil backup
            await this.saveAdminPassword(newPassword); 
            
            ui.stopLoading();
            ui.showNotification('success', '✅ Admin password changed successfully!');
            return true;
            
        } catch (error) {
            ui.stopLoading();
            ui.showNotification('error', `❌ Failed to save password: ${error.message}`);
            return false;
        }
    }

    // **DIUBAH: Memperbarui file utama DAN memanggil update backup**
    async saveAdminPassword(newPassword) {
        const adminFile = path.join(__dirname, '.admin-password-secure');
        const timestamp = new Date().toISOString();
        
        const adminData = {
            password: newPassword,
            timestamp: timestamp,
            type: 'ADMIN_PASSWORD',
            securityLevel: 'HIGH'
        };
        
        const encryptedData = this.encryptData(JSON.stringify(adminData));
        
        const fileData = {
            ...encryptedData,
            metadata: {
                system: 'FA_STARX_BOT',
                created: timestamp,
                version: '1.0'
            }
        };
        
        // 1. Simpan file admin utama
        fs.writeFileSync(adminFile, JSON.stringify(fileData, null, 2));
        
        // 2. Simpan file cadangan
        await this.updateBackupFilesWithAdminPassword(adminData);
    }

    async updateBackupFilesWithAdminPassword(adminData) {
        const backupFiles = [
            '.secure-backup-marker',
            '.system-integrity-check'
        ];
        
        console.log('🔄 Updating admin password backup files...');
        
        for (const file of backupFiles) {
            const filePath = path.join(__dirname, file);
            try {
                // Ambil data yang ada (jika ada) untuk ditimpa
                let existingData = {};
                if (fs.existsSync(filePath)) {
                   try {
                       const content = fs.readFileSync(filePath, 'utf8');
                       const data = JSON.parse(content);
                       existingData = JSON.parse(this.decryptData(data));
                   } catch (e) { /* abaikan jika gagal baca */ }
                }

                const backupData = {
                    ...existingData, // Pertahankan data lama (spt filePurpose)
                    ...adminData,    // Timpa dengan data admin baru
                    isBackup: true,
                    primaryFile: '.admin-password-secure',
                    timestamp: new Date().toISOString() // Selalu perbarui timestamp
                };
                
                const encryptedBackup = this.encryptData(JSON.stringify(backupData));
                const fileData = {
                    ...encryptedBackup,
                    metadata: {
                        system: 'FA_STARX_BOT_BACKUP',
                        fileType: 'ADMIN_PASSWORD_BACKUP',
                        created: new Date().toISOString()
                    }
                };
                
                fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
                console.log(`✅ Admin backup saved to: ${file}`);
                
            } catch (error) {
                console.log(`❌ Failed to backup to ${file}: ${error.message}`);
            }
        }
    }

    async showPasswordManagement() {
        ui.createBox('🔐 PASSWORD MANAGEMENT', [
            'Security System Management',
            '',
            '📋 Options:',
            '1. Change Admin Password',
            '2. GitHub Validation',
            '3. Security Status',
            '4. Back to Main Menu',
            '',
            'Select option:'
        ], 'info');

        const choice = await input.question('Select option (1-4): ');
        return choice;
    }

    async manualGitHubValidation() {
        ui.startLoading('🔍 Validating GitHub sources...');
        const result = await this.validateGitHubSources();
        ui.stopLoading();
        
        if (result.validated) {
            ui.showNotification('success', '✅ GitHub validation successful!');
        } else {
            ui.showNotification('info', `ℹ️ ${result.message}`);
        }
        
        return result;
    }

    showSecurityStatus() {
        const fileStatus = this.checkFileStatus();
        
        ui.createBox('🔐 SECURITY STATUS', [
            'FA STARX BOT SECURITY SYSTEM',
            '',
            '📊 File Status:',
            `Total Files: ${this.securityFiles.length}`,
            `Existing: ${fileStatus.existing}`,
            `Missing: ${fileStatus.missing}`,
            `Integrity: ${fileStatus.missing > 0 ? '❌ FAILED (TAMPERED)' : '✅ OK'}`,
            '',
            '🔑 Password Status:',
            `Admin: ${this.hashDisplay(this.adminPassword)}`,
            `Script: ${this.hashDisplay(this.scriptPassword)}`,
            '',
            '🌐 GitHub Status:',
            `MAIN: ${this.githubStatus.MAIN.connected ? '✅' : '❌'}`,
            `BACKUP: ${this.githubStatus.BACKUP.connected ? '✅' : '❌'}`,
            `Validated: ${this.consensusAchieved ? '✅' : '❌'}`
        ], 'info');
    }

    checkFileStatus() {
        let existing = 0;
        let missing = 0;
        
        for (const file of this.securityFiles) {
            if (fs.existsSync(path.join(__dirname, file))) {
                existing++;
            } else {
                missing++;
            }
        }
        
        return { existing, missing };
    }

    hashDisplay(password) {
        if (!password) return '...';
        return crypto.createHash('sha256').update(password).digest('hex').substring(0, 12) + '...';
    }
}

// ===== PASSWORD MANAGEMENT HANDLER =====
// (Fungsi helper dari sistem keamanan baru Anda)
async function handlePasswordManagement(passwordSystem) {
    while (true) {
        const choice = await passwordSystem.showPasswordManagement();
        
        switch (choice) {
            case '1': // Change Admin Password
                await passwordSystem.changeAdminPassword();
                break;
            case '2': // GitHub Validation
                await passwordSystem.manualGitHubValidation();
                break;
            case '3': // Security Status
                passwordSystem.showSecurityStatus();
                break;
            case '4': // Back to Main Menu
                return;
            default:
                ui.showNotification('error', 'Invalid selection');
        }
        
        await input.question('Press Enter to continue...');
    }
}

// ===== COMBINED MAIN MENU =====
// (Menu baru yang menggabungkan fitur bot & fitur keamanan)
async function showMainMenu(accessLevel) {
    const isAdmin = accessLevel === 'admin';
    
    const menuItems = [
        '🪙 ETH Auto-Forward', // 1
        '🪙 Token Auto-Forward', // 2
        '🪙 Token Transfer Once', // 3
        '🎯 Auto Token Detection', // 4
        '👥 Manage Accounts', // 5
        '🗑️  Delete Account' // 6
    ];

    if (isAdmin) {
        menuItems.push('🔐 Security Status'); // 7
        menuItems.push('🔑 Password Management'); // 8
    }
    
    menuItems.push('❌ Exit Application'); // 9 (atau 7 untuk user)
    
    const lastItem = menuItems.length;

    ui.createMenu('🎯 MAIN MENU - FA STARX BOT v9.2', menuItems, 
        `Select an operation mode: | Access: ${isAdmin ? 'ADMIN' : 'USER'}`);

    const choice = await input.question(`Select option (1-${lastItem}): `);
    
    // Map pilihan ke string yang konsisten
    const choiceNum = parseInt(choice);
    if (choiceNum === lastItem) return 'exit';
    
    if (isAdmin) {
        if (choiceNum === 7) return 'status';
        if (choiceNum === 8) return 'mgmt';
    }
    
    if (choiceNum >= 1 && choiceNum <= 6) {
        return choice; // Mengembalikan '1', '2', '3', '4', '5', '6'
    }

    return 'invalid'; // Pilihan tidak valid
}


// ===== MAIN APPLICATION LOOP (COMBINED) =====
// (Fungsi main() baru yang menggabungkan keamanan DAN fungsionalitas)
async function main() {
    try {
        ui.showBanner();
        
        // ===== BAGIAN KEAMANAN BARU =====
        console.log('🚀 FA STARX BOT - SECURITY SYSTEM');
        console.log('='.repeat(50));
        
        const passwordSystem = new GitHubPasswordSync();
        await passwordSystem.initialize();
        
        const loginResult = await passwordSystem.verifyAccess();
        
        if (!loginResult.success) {
            ui.showNotification('error', '❌ Access denied. Exiting...');
            process.exit(1);
        }

        if (loginResult.accessLevel === 'admin') {
            ui.createBox('🎉 WELCOME ADMINISTRATOR', [
                'Full System Access Granted',
                '',
                '🔓 Available Features:',
                '• All Bot Operations',
                '• Password Management',
                '• Security Settings',
                '',
                '💡 Use the menu to manage system'
            ], 'success');
        } else {
            ui.createBox('🎉 WELCOME USER', [
                'Script Access Granted',
                '',
                '📋 Available Operations:',
                '• ETH Auto-Forward',
                '• Token Auto-Forward',
                '• Token Transfer',
                '• Auto Detection',
                '',
                '🔒 Secure system active'
            ], 'info');
        }
        
        await input.question('Press Enter to continue...');
        const userAccessLevel = loginResult.accessLevel;
        // ===== AKHIR BAGIAN KEAMANAN =====

        // ===== BAGIAN BOT ASLI (FUNGSIONAL) =====
        const telegramNotifier = await setupTelegramNotifier();
        
        while (true) {
            const choice = await showMainMenu(userAccessLevel);
            
            switch (choice) {
                case '1': // ETH Auto-Forward
                    const ethConfig = await selectAccount('1');
                    if (ethConfig) {
                        await runEthAutoForward(ethConfig, telegramNotifier);
                    }
                    break;
                    
                case '2': // Token Auto-Forward
                    const tokenConfig = await selectAccount('2');
                    if (tokenConfig) {
                        await runTokenAutoForward(tokenConfig, telegramNotifier);
                    }
                    break;
                    
                case '3': // Token Transfer Once
                    const transferConfig = await selectAccount('3');
                    if (transferConfig) {
                        await runTokenTransferOnce(transferConfig, telegramNotifier);
                    }
                    break;
                    
                case '4': // AUTO TOKEN DETECTION
                    const autoConfig = await selectAccount('4');
                    if (autoConfig) {
                        await runAutoTokenDetection(autoConfig, telegramNotifier);
                    }
                    break;
                    
                case '5': // View Accounts
                    await viewAccountConfigurations();
                    break;
                    
                case '6': // Delete Account
                    await deleteAccountConfiguration();
                    break;

                // --- Kasus baru untuk Keamanan ---
                case 'status': // Hanya Admin
                    passwordSystem.showSecurityStatus();
                    await input.question('Press Enter...');
                    break;
                    
                case 'mgmt': // Hanya Admin
                    await handlePasswordManagement(passwordSystem);
                    break;
                    
                case 'exit': // Keluar
                    ui.showNotification('info', 'Thank you for using FA STARX BOT v9.2!');
                    input.close();
                    process.exit(0);
                    
                default:
                    ui.showNotification('error', 'Invalid selection');
            }
            
            await sleep(1000);
        }
    } catch (error) {
        ui.showNotification('error', `Application error: ${error.message}`);
        input.close();
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    ui.showNotification('info', 'Bot stopped by user');
    input.close();
    process.exit(0);
});

// Start the application
main();
