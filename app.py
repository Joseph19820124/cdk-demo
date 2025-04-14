#!/usr/bin/env python3
import aws_cdk as cdk
from cdk_app.main_stack import MainStack

app = cdk.App()
MainStack(app, "MainStack")
