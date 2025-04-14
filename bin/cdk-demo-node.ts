#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkDemoNodeStack } from '../lib/cdk-demo-node-stack';

const app = new cdk.App();
new CdkDemoNodeStack(app, 'CdkDemoNodeStack');
