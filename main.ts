import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface SnorkelSettings {
    mySetting: string;
    dailyNoteFolder: string;
    dailyNoteTemplate: string;
}

const DEFAULT_SETTINGS: SnorkelSettings = {
    mySetting: 'default',
    dailyNoteFolder: '',
    dailyNoteTemplate: ''
}

export default class SnorkelPlugin extends Plugin {
    settings: SnorkelSettings;

    async onload() {
        await this.loadSettings();

        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon('dice', 'Snorkel Plugin', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            new Notice('Hello from Snorkel!');
        });
        // Perform additional things with the ribbon
        ribbonIconEl.addClass('snorkel-ribbon-class');

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Status Bar Text');

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'open-sample-modal-simple',
            name: 'Open sample modal (simple)',
            callback: () => {
                new SampleModal(this.app).open();
            }
        });

        // Daily Note command - creates test.md in configured folder
        this.addCommand({
            id: 'daily-note',
            name: 'Daily Note',
            callback: async () => {
                try {
                    // Get today's date in YYYY-MM-DD format
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const fileName = `${year}-${month}-${day}.md`;

                    const baseFolder = this.settings.dailyNoteFolder;
                    const yearFolder = baseFolder ? `${baseFolder}/${year}` : `${year}`;
                    const monthFolder = `${yearFolder}/${month}`;
                    const filePath = `${monthFolder}/${fileName}`;

                    // Check if file already exists
                    let file = this.app.vault.getAbstractFileByPath(filePath);

                    if (!file) {
                        // Ensure folder path exists (including year and month subfolders)
                        if (!this.app.vault.getAbstractFileByPath(monthFolder)) {
                            await this.app.vault.createFolder(monthFolder);
                        }

                        // Create empty file
                        const newFile = await this.app.vault.create(filePath, '');

                        // Open the file first
                        const leaf = this.app.workspace.getLeaf('tab');
                        await leaf.openFile(newFile);

                        // Apply template using Templater if configured
                        if (this.settings.dailyNoteTemplate) {
                            // Check for incorrect path separators
                            if (this.settings.dailyNoteTemplate.includes('\\')) {
                                new Notice('Template path must use forward slashes (/), not backslashes (\\). Example: Path/To/Template.md');
                                return;
                            }

                            const templater = (this.app as any).plugins.plugins['templater-obsidian'];
                            if (templater) {

                                // Wait for file to be fully loaded in the editor
                                await new Promise(resolve => setTimeout(resolve, 100));

                                const templateFile = this.app.vault.getAbstractFileByPath(this.settings.dailyNoteTemplate);
                                if (templateFile instanceof TFile) {
                                    // Read template content and process it
                                    const content = await this.app.vault.read(templateFile);
                                    await this.app.vault.modify(newFile, content);
                                    // Trigger Templater to process the file
                                    await templater.templater.overwrite_file_commands(newFile);
                                } else {
                                    new Notice('Template file not found: ' + this.settings.dailyNoteTemplate);
                                }
                            } else {
                                new Notice('Templater plugin not found');
                            }
                        }
                    } else {
                        // File exists, just open it
                        const leaf = this.app.workspace.getLeaf('tab');
                        if (file instanceof TFile) {
                            await leaf.openFile(file);
                        }
                    }
                } catch (error) {
                    new Notice('Error creating daily note: ' + error.message);
                }
            }
        });

        // This adds an editor command that can perform some operation on the current editor instance
        this.addCommand({
            id: 'sample-editor-command',
            name: 'Sample editor command',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                console.log(editor.getSelection());
                editor.replaceSelection('Sample Editor Command');
            }
        });
        // This adds a complex command that can check whether the current state of the app allows execution of the command
        this.addCommand({
            id: 'open-sample-modal-complex',
            name: 'Open sample modal (complex)',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.
                    if (!checking) {
                        new SampleModal(this.app).open();
                    }

                    // This command will only show up in Command Palette when the check function returns true
                    return true;
                }
            }
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            console.log('click', evt);
        });

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: SnorkelPlugin;

    constructor(app: App, plugin: SnorkelPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret.')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Daily Note Folder')
            .setDesc('Folder where daily note will be created.')
            .addText(text => text
                .setPlaceholder('folder/subfolder')
                .setValue(this.plugin.settings.dailyNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.dailyNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Daily Note Template')
            .setDesc('Path to template file to apply via Templater API (e.g., Templates/Daily Note.md). Leave empty to rely on Templater folder templates instead.')
            .addText(text => text
                .setPlaceholder('Templates/Daily Note.md')
                .setValue(this.plugin.settings.dailyNoteTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.dailyNoteTemplate = value;
                    await this.plugin.saveSettings();
                }));
    }
}
