use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::{Rc, Weak};
use netstat2::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo, SocketInfo, TcpState};
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, skip_serializing_none};
use specta::Type;
use sysinfo::{DiskUsage, Process, System};
use crate::error::Result;


#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub enum SockProtocol {
    Tcp,
    Udp,
}

impl From<&ProtocolSocketInfo> for SockProtocol {
    fn from(info: &ProtocolSocketInfo) -> Self {
        match info {
            ProtocolSocketInfo::Tcp(_) => Self::Tcp,
            ProtocolSocketInfo::Udp(_) => Self::Udp,
        }
    }
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub enum SockState {
    Closed,
    Listen,
    SynSent,
    SynReceived,
    Established,
    FinWait1,
    FinWait2,
    CloseWait,
    Closing,
    LastAck,
    TimeWait,
    DeleteTcb,
    Unknown
}

impl From<&TcpState> for SockState {
    fn from(state: &TcpState) -> Self {
        match state {
            TcpState::Closed => {Self::Closed}
            TcpState::Listen => {Self::Listen}
            TcpState::SynSent => {Self::SynSent}
            TcpState::SynReceived => {Self::SynReceived}
            TcpState::Established => {Self::Established}
            TcpState::FinWait1 => {Self::FinWait1}
            TcpState::FinWait2 => {Self::FinWait2}
            TcpState::CloseWait => {Self::CloseWait}
            TcpState::Closing => {Self::Closing}
            TcpState::LastAck => {Self::LastAck}
            TcpState::TimeWait => {Self::TimeWait}
            TcpState::DeleteTcb => {Self::DeleteTcb}
            TcpState::Unknown => {Self::Unknown}
        }
    }
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub struct SockInfo {
    local_addr: String,
    local_port: u16,
    protocol: SockProtocol,
    pids: Vec<u32>,
    remote_addr: Option<String>,
    remote_port: Option<u16>,
    state: Option<SockState>,
}

impl From<&SocketInfo> for SockInfo {
    fn from(sock_info: &SocketInfo) -> Self {
        let protocol = SockProtocol::from(&sock_info.protocol_socket_info);
        let (local_addr, local_port, remote_addr, remote_port, state) = match &sock_info.protocol_socket_info {
            ProtocolSocketInfo::Tcp(info) => {
                (
                    info.local_addr.to_string(),
                    info.local_port.clone(),
                    Some(info.remote_addr.to_string()),
                    Some(info.remote_port),
                    Some(SockState::from(&info.state))
                )
            }
            ProtocolSocketInfo::Udp(info) => {
                (
                    info.local_addr.to_string(),
                    info.local_port.clone(),
                    None,
                    None,
                    None
                )
            }
        };
        let pids = sock_info.associated_pids.clone();
        Self {
            local_addr,
            local_port,
            protocol,
            pids,
            remote_addr,
            remote_port,
            state,
        }

    }
}


pub fn get_sockets() -> Result<Vec<SockInfo>> {
    let af_flags = AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;
    let sockets_info = get_sockets_info(af_flags, proto_flags)?;
    Ok(sockets_info.iter().map(SockInfo::from).collect())
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug, Default)]
pub struct ProcessInfo {
    pid: u32,
    ppid: Option<u32>,
    name: Option<String>,
    exe: Option<String>,
    cpu_usage: Option<f32>,
    memory: Option<u64>,
    disk_usage: Option<DiskInfo>,
    accumulated_cpu_time: Option<u64>,
    local_addr: Option<String>,
    local_port: Option<u16>,
    protocol: Option<SockProtocol>,
    remote_addr: Option<String>,
    remote_port: Option<u16>,
    state: Option<SockState>,
}


#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub struct ProcessTreeNode {
    value: ProcessInfo,
    children: Vec<Rc<RefCell<ProcessTreeNode>>>,

    #[specta(skip)]
    #[serde(skip)]
    parent: Option<Weak<RefCell<ProcessTreeNode>>>,

    depth: Option<usize>
}


#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
struct DiskInfo {
    read_bytes: u64,
    write_bytes: u64,
    total_read_bytes: u64,
    total_write_bytes: u64,
}

impl From<&DiskUsage> for DiskInfo {
    fn from(disk_usage: &DiskUsage) -> Self {
        Self {
            read_bytes: disk_usage.read_bytes,
            write_bytes: disk_usage.written_bytes,
            total_read_bytes: disk_usage.total_read_bytes,
            total_write_bytes: disk_usage.total_written_bytes,
        }
    }
}



fn make_process_info(process: &Process, socket_info: Option<&SockInfo>) -> ProcessInfo {
    let pid = process.pid().as_u32();
    let name = Some(process.name().to_string_lossy().to_string());
    let exe = process.exe().map(|p|p.to_string_lossy().to_string());
    let cpu_usage = Some(process.cpu_usage());
    let memory = Some(process.memory());
    let disk_usage = Some(DiskInfo::from(&process.disk_usage()));
    let accumulated_cpu_time = Some(process.accumulated_cpu_time());
    let ppid = process.parent().map(|p| p.as_u32());
    let (
        local_addr, local_port, protocol, remote_addr, remote_port, state
    ) = match socket_info {
        Some(socket_info) => {
            (
                Some(socket_info.local_addr.clone()),
                Some(socket_info.local_port),
                Some(socket_info.protocol.clone()),
                socket_info.remote_addr.clone(),
                socket_info.remote_port.clone(),
                socket_info.state.clone(),
            )
        }
        None => (None, None, None, None, None, None)

    };

    ProcessInfo {
        pid,
        ppid,
        name,
        exe,
        cpu_usage,
        memory,
        disk_usage,
        accumulated_cpu_time,

        local_addr,
        local_port,
        protocol,
        remote_addr,
        remote_port,
        state,
    }
}

pub fn get_processes_map() -> Result<HashMap<u32, ProcessInfo>> {
    let af_flags = AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;
    let sockets_info = get_sockets_info(af_flags, proto_flags)?;
    let sockets: Vec<SockInfo> = sockets_info.iter().map(SockInfo::from).collect();


    let mut system = System::new_all();
    system.refresh_all();
    let processes = system.processes();

    let mut process_map: HashMap<u32, ProcessInfo> = processes.iter().map(|(k,v)| {
        let pid = k.as_u32();
        let find_socket = sockets.iter().find(|s| {
            s.pids.contains(&pid)
        });

        (
            pid,
            make_process_info(v, find_socket)
        )
    }).collect();

    let pids: Vec<u32> = processes.keys().map(|k|k.as_u32()).collect();
    processes.iter().filter(|(_,v)| {
        if let Some(parent) = v.parent() {
            !pids.contains(&parent.as_u32())
        } else {
            false
        }
    }).for_each(|(_k, v)| {
        if let Some(parent) = v.parent() {
            let ppid = parent.as_u32();
            process_map.entry(ppid).or_insert(ProcessInfo {
                pid: ppid,
                ..ProcessInfo::default()
            });
        }
    });
    Ok(process_map)
    // Ok(process_map.into_iter().map(|(_,v)| v).collect())
}

pub fn get_processes() -> Result<Vec<ProcessInfo>> {
    let process_map = get_processes_map()?;
    Ok(process_map.into_iter().map(|(_,v)| v).collect())
}


pub fn get_processes_tree() -> Result<(Vec<Rc<RefCell<ProcessTreeNode>>>)> {
    let process_map = get_processes_map()?;

    let tree: HashMap<u32, Rc<RefCell<ProcessTreeNode>>> = process_map.iter().map(|(k,v)| {
        let pid = k.clone();
        (
            pid,
            Rc::new(RefCell::new(ProcessTreeNode {
                children: vec![],
                parent: None,
                value: v.clone(),
                depth: None,
            }))
        )
    }).collect();

    fn get_depth(process_map: &HashMap<u32, ProcessInfo>, pid: u32) -> Option<usize> {
        let mut depth = 0;
        let mut cur_pid = pid;
        while let Some(ppid) = process_map.get(&cur_pid)?.ppid {
            cur_pid = ppid;
            depth += 1;
        }
        Some(depth)
    }


    for (_k, node) in tree.iter() {
        let ppid = node.borrow().value.ppid;
        let pid = node.borrow().value.pid;
        if let Some(ppid) = ppid {
            if let Some(parent) = tree.get(&ppid) {
                parent.borrow_mut().children.push(Rc::clone(&node));
                node.borrow_mut().parent = Some(Rc::downgrade(parent));
            }
        }
        node.borrow_mut().depth = get_depth(&process_map, pid);
    }

    let root_tree: Vec<Rc<RefCell<ProcessTreeNode>>> = tree.into_iter().filter(|(_k, node)| {
            node.borrow().parent.is_none()
        })
        .map(|(_k, v)| v)
        .collect();

    Ok(root_tree)
}

#[cfg(test)]
mod tests {
    use super::*;

    // #[test]
    // fn test_get_sockets() {
    //     println!("{:?}", get_sockets());
    //     assert!(matches!(get_sockets(), Ok(_)));
    // }

    // #[test]
    // fn test_get_processes() {
    //     println!("{:?}", get_processes());
    //     assert!(matches!(get_processes(), Ok(_)));
    // }

    #[test]
    fn test_get_processes_map() {
        // println!("{:?}", get_processes_map());
        assert!(matches!(get_processes_map(), Ok(_)));
    }
}