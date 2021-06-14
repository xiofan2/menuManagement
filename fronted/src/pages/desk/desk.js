/*
 * @Date: 2021-06-13 20:04:48
 * @LastEditTime: 2021-06-14 13:25:50
 */
import React, { useState, useEffect, useContext } from 'react'
import {
  Button,
  PageHeader,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  message
} from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import '@style/pages/desk.less'
import myAxios from '@config/myAxios'
import { PageContext } from '@config/context'
import servicePath from '@config/api'

const { confirm } = Modal

const Desk = () => {
  const [form] = Form.useForm()
  const pageContext = useContext(PageContext)
  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  }
  const columns = [
    {
      title: '编号',
      dataIndex: 'index',
      render: (index) => (pagination.current - 1) * pagination.pageSize + index
    },
    {
      title: '桌子类型',
      dataIndex: 'type'
    },
    {
      title: '桌子数量',
      dataIndex: 'number'
    },
    {
      title: '桌子座位数量',
      dataIndex: 'seatAmount'
    },
    {
      title: '可座人数',
      dataIndex: 'peopleAmount'
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record.id)}>
            编辑
          </Button>
          <Button type="link" onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </>
      )
    }
  ]

  const [tableData, setTableData] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })
  const [editId, setEditId] = useState()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    handleTableChange(pagination)
  }, [])

  const handleTableChange = (pageConfig) => {
    myAxios(
      {
        ...servicePath.getAllDesk,
        params: {
          restaurantId: localStorage.getItem('restaurantId'),
          current: pageConfig.current,
          pageSize: pageConfig.pageSize
        }
      },
      (res) => {
        if (res.data.success) {
          const { list, totalData } = res.data.data
          setTableData(
            list.map((item, index) => ({
              id: item.id,
              index: index + 1,
              type: item.type,
              number: item.number,
              seatAmount: item.seatAmount,
              peopleAmount: item.peopleAmount
            }))
          )
          setPagination({
            ...pageConfig,
            total: totalData
          })
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('查询信息失败,请联系管理员')
      },
      pageContext
    )
  }

  const handleAdd = () => {
    setShowModal(true)
  }

  const handleEdit = (id) => {
    myAxios(
      {
        ...servicePath.getDeskById,
        params: {
          id
        }
      },
      (res) => {
        if (res.data.success) {
          const { data } = res.data
          form.setFieldsValue({
            type: data.type,
            number: data.number,
            seatAmount: data.seatAmount,
            peopleAmount: data.peopleAmount
          })
          setShowModal(true)
          setEditId(id)
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('查询信息失败,请联系管理员')
      },
      pageContext
    )
  }

  const handleDelete = (id) => {
    confirm({
      title: '确定要删除吗?',
      icon: <ExclamationCircleOutlined />,
      cancelText: '取消',
      okText: '确定',
      onOk() {
        myAxios(
          {
            ...servicePath.deleteDeskById,
            params: {
              id
            }
          },
          (res) => {
            if (res.data.success) {
              message.success('删除成功')
              handleTableChange(pagination)
            } else {
              message.error(res.data.message)
              return Promise.reject()
            }
          },
          () => {
            message.error('删除失败,请联系管理员')
            return Promise.reject()
          },
          pageContext
        )
      }
    })
  }

  const handleCancel = () => {
    form.resetFields()
    setEditId()
    setShowModal(false)
  }

  const handleSave = () => {
    form.validateFields().then(() => {
      const formValue = form.getFieldsValue()
      myAxios(
        {
          ...servicePath.operateDesk,
          data: {
            id: editId,
            ...formValue,
            restaurantId: localStorage.getItem('restaurantId')
          }
        },
        (res) => {
          if (res.data.success) {
            message.success('保存成功')
            handleCancel()
            handleTableChange(pagination)
          } else {
            message.error(res.data.message)
          }
        },
        () => {
          message.error('保存失败,请联系管理员')
        },
        pageContext
      )
    })
  }

  return (
    <div className="desk-container">
      <PageHeader className="site-page-header" title="桌椅管理" />
      <div className="table-body">
        <div className="table-operate">
          <Button type="primary" onClick={handleAdd}>
            新增
          </Button>
        </div>
        <Table
          bordered
          columns={columns}
          dataSource={tableData}
          rowKey={(record) => record.id}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </div>
      <Modal
        title={`${editId ? '修改' : '新增'}桌椅`}
        visible={showModal}
        maskClosable={false}
        okText="保存"
        onOk={handleSave}
        onCancel={handleCancel}
      >
        <Form {...layout} form={form}>
          <Form.Item
            name="type"
            label="桌子类型名称"
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="请输入桌子类型" />
          </Form.Item>
          <Form.Item
            name="number"
            label="桌子数量"
            rules={[{ required: true }]}
          >
            <InputNumber
              size="large"
              placeholder="请输入桌子数量"
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="seatAmount"
            label="桌子座位数量"
            rules={[{ required: true }]}
          >
            <InputNumber
              size="large"
              placeholder="请输入桌子座位数量"
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="peopleAmount"
            label="可座人数"
            rules={[{ required: true }]}
          >
            <InputNumber
              size="large"
              placeholder="请输入可座人数"
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Desk
