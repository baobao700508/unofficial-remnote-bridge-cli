/**
 * Addon 注册表
 *
 * 静态注册所有已知增强项目的元数据。
 * 每个 addon 定义安装方式、检测命令、环境变量映射等信息。
 */

/** Addon 元数据定义 */
export interface AddonDefinition {
  /** 唯一标识（与 addons 配置中的 key 一致） */
  name: string;

  /** 人类可读描述 */
  description: string;

  /** 安装器类型 */
  installer: 'pip' | 'npm';

  /** 包名（pip/npm install 时使用）。未指定则使用 name */
  packageName?: string;

  /** 可执行文件名（用于 PATH 检测） */
  executableName: string;

  /** 检测命令：执行后 exitCode === 0 视为已安装 */
  detectCommand: { bin: string; args: string[] };

  /** settings key → 环境变量名的映射 */
  envMapping: Record<string, string>;

  /** 启用时必须提供的 settings 项 */
  requiredSettings?: string[];

  /** 数据目录（clean/purge 时清理），~ 代表 HOME */
  dataDirs?: string[];

  /** 版本约束（如 '>=0.1.0'） */
  versionConstraint?: string;
}

/** 内置 addon 注册表 */
export const ADDON_REGISTRY: ReadonlyMap<string, AddonDefinition> = new Map([
  [
    'remnote-rag',
    {
      name: 'remnote-rag',
      description: 'RemNote 语义搜索增强：直读本地数据库，构建向量索引',
      installer: 'pip',
      packageName: 'remnote-rag',
      executableName: 'remnote-rag',
      detectCommand: { bin: 'remnote-rag', args: ['--help'] },
      envMapping: {},
      requiredSettings: [],
      dataDirs: ['~/.remnote-bridge/addons/remnote-rag'],
      versionConstraint: '>=0.1.0',
    },
  ],
]);
