'use client';

import { 
  pullAllData,
  addSyncData,
  syncProductSingle
} from '@zsqk/z1-sdk/es/z1p/sync-data';
import { addSyncLogWithData } from '@zsqk/z1-sdk/es/z1p/sync-log';

import { Button, Descriptions, Table, Progress, Space } from 'antd';
import { PageHeader } from '@ant-design/pro-components';
import { Suspense, useMemo, useState } from 'react';
import { Content } from '../../components/style/Content';
import { postAwait } from '../../error';
import PageWrap from '../../components/PageWrap';

export default function () {
  return (
    <Suspense>
      <ClientPage />
    </Suspense>
  );
}

/**
 * [页面] 数据同步
 *
 * 功能点:
 *
 * 1. 商品数据同步. (包括 SPU 分类, SPU, SKU)
 * 
 * 同步流程：
 * - 拉取数据：pullAllData()
 * - 整理数据：addSyncData()
 * - 写同步日志：addSyncLogWithData()
 * - 单账套写入数据：循环调用 syncProductSingle()
 *
 * @author Lian Zheren <lzr@go0356.com>
 */
function ClientPage() {
  const [msg, setMsg] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [productSyncInfo, setProductSyncInfo] = useState<
    Array<{
      name: string;
      errMsg?: string;
      resCode: string;
      status: string;
    }>
  >();
  const [disabled, setDisabled] = useState(false);

  const fn = useMemo(() => {
    console.log('SyncButton init');
    return () => {
      postAwait(
        async () => {
          setDisabled(true);
          setProductSyncInfo(undefined);
          setProgress(0);
          
          try {
            // 步骤1: 拉取数据
            setCurrentStep('正在从公库拉取数据...');
            setProgress(10);
            const data = await pullAllData();
            
            // 步骤2: 生成同步数据相关信息  
            setCurrentStep('正在整理同步数据...');
            setProgress(30);
            const syncDataResult = await addSyncData({ data });
            const syncDataID = syncDataResult.syncDataID;
            
            // 步骤3: 生成同步日志
            setCurrentStep('正在生成同步日志...');
            setProgress(40);
            const logID = await addSyncLogWithData({ syncDataID, data });
            
            // 步骤4: 获取需要同步的账套列表
            // 这里需要根据实际业务逻辑获取账套列表
            // 暂时使用硬编码的账套ID列表作为示例
            const tenantIDs = [
              'newgy', 'gx', 'zsqk', 'gy', 'gx0775', 
              'haombo', 'zsqkp', 'jcxiaomi', 'llxiaomi'
            ]; // 实际应该从配置或API获取
            
            setCurrentStep('正在向各账套同步数据...');
            const totalSets = tenantIDs.length;
            const syncResults: Array<{
              name: string;
              errMsg?: string;
              resCode: string;
              status: string;
            }> = [];
            
            // 步骤5: 循环调用 syncProductSingle 向各账套写数据
            for (let i = 0; i < totalSets; i++) {
              const tenantID = tenantIDs[i];
              const currentProgress = 40 + Math.floor((i / totalSets) * 50);
              setProgress(currentProgress);
              setCurrentStep(`正在同步账套 ${tenantID} (${i + 1}/${totalSets})...`);
              
              try {
                const result = await syncProductSingle({ 
                  tenantID, 
                  syncDataID, 
                  data,
                  logID 
                });
                syncResults.push({
                  name: tenantID,
                  resCode: result.resCode === 'complete' ? '已成功' : '失败',
                  status: '已完成',
                  errMsg: result.errMsg || '',
                });
              } catch (error) {
                syncResults.push({
                  name: tenantID,
                  resCode: '失败',
                  status: '已完成',
                  errMsg: error instanceof Error ? error.message : '未知错误',
                });
              }
            }
            
            setProductSyncInfo(syncResults);
            setProgress(100);
            setCurrentStep('');
            setMsg('已完成同步请求');
          } catch (error) {
            setMsg(`同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
            setCurrentStep('');
            setProgress(0);
          } finally {
            setDisabled(false);
          }
        },
        { timeoutThreshold: 180000 } // 超时时间3分钟
      )();
    };
  }, []);

  return (
    <PageWrap ppKey="product-manage">
      <PageHeader
        title="数据同步"
        subTitle="将数据同步到各个账套中. "
      ></PageHeader>
      <Content>
        <Descriptions>
          <Descriptions.Item label="可被同步的数据">
            目前支持同步的数据有: SPU 分类, SPU, SKU.
          </Descriptions.Item>
          <Descriptions.Item label="同步时间">
            因为同步的时候会锁表, 所以尽量在平台数据修改完成之后再进行同步.
          </Descriptions.Item>
          <Descriptions.Item label="同步流程">
            拉取数据 → 整理数据 → 写同步日志 → 向各账套写入数据
          </Descriptions.Item>
        </Descriptions>
        
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          <Button disabled={disabled} onClick={fn} type="primary">
            商品数据同步 (包括 SPU 分类, SPU, SKU)
          </Button>
          
          {disabled && (
            <div style={{ marginTop: 16 }}>
              <Progress 
                percent={progress} 
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              {currentStep && (
                <div style={{ marginTop: 8, color: '#666' }}>
                  {currentStep}
                </div>
              )}
            </div>
          )}
          
          {msg && (
            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              backgroundColor: msg.includes('失败') ? '#fff2f0' : '#f6ffed',
              border: `1px solid ${msg.includes('失败') ? '#ffccc7' : '#b7eb8f'}`,
              borderRadius: 6,
              color: msg.includes('失败') ? '#a8071a' : '#389e0d'
            }}>
              {msg}
            </div>
          )}
        </Space>

        {productSyncInfo && (
          <Table
            style={{ marginTop: 24 }}
            dataSource={productSyncInfo}
            size="small"
            pagination={false}
            columns={[
              {
                title: '账套名称',
                dataIndex: 'name',
                width: 200,
              },
              {
                title: '同步进程',
                dataIndex: 'status',
                width: 100,
                render: (status: string) => (
                  <span style={{ color: status === '已完成' ? '#52c41a' : '#1890ff' }}>
                    {status}
                  </span>
                ),
              },
              {
                title: '同步结果',
                dataIndex: 'resCode',
                width: 100,
                render: (resCode: string) => (
                  <span style={{ 
                    color: resCode === '已成功' ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold'
                  }}>
                    {resCode}
                  </span>
                ),
              },
              {
                title: '提示信息',
                dataIndex: 'errMsg',
                render: (errMsg: string) => (
                  <span style={{ color: errMsg ? '#ff4d4f' : '#666' }}>
                    {errMsg || '无'}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Content>
    </PageWrap>
  );
}
